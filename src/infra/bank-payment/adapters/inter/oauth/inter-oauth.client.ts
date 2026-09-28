import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { Agent } from 'node:https';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentCredentialsDto } from 'src/infra/bank-payment/dtos/bank-payment-credentials.dto';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import { toLoggableHttpError } from '../to-loggable-http-error';
import { InterOauthTokenDto } from './dtos/inter-oauth-token.dto';
import { InterTokenResponseDto } from './dtos/inter-token-response.dto';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';
import { InterCertLoader } from './inter-cert.loader';

type CachedToken = {
  token: InterOauthTokenDto;
  expiresAtMs: number;
};

@Injectable()
export class InterOauthClient {
  private static readonly EXPIRY_MARGIN_MS = 60_000;

  private readonly cache = new Map<string, CachedToken>();
  private readonly inflight = new Map<string, Promise<InterOauthTokenDto>>();

  constructor(
    private readonly httpService: HttpService,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  public async getAccessToken(scope: string, credentials: BankPaymentCredentialsDto): Promise<InterOauthTokenDto> {
    const normalizedScope = this.normalizeScope(scope);
    if (!normalizedScope) {
      throw new InterOauthConfigError('Escopo OAuth do Banco Inter não pode ser vazio');
    }

    const cacheKey = this.cacheKey(credentials, normalizedScope);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAtMs > Date.now()) {
      return cached.token;
    }

    const pending = this.inflight.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request = this
      .fetchAndCache(cacheKey, normalizedScope, credentials)
      .finally(() => this.inflight.delete(cacheKey));

    this.inflight.set(cacheKey, request);
    return request;
  }

  private async fetchAndCache(
    cacheKey: string,
    normalizedScope: string,
    credentials: BankPaymentCredentialsDto,
  ): Promise<InterOauthTokenDto> {
    const token = await this.requestToken(normalizedScope, credentials);
    this.cache.set(cacheKey, {
      token,
      expiresAtMs: Date.now() + (token.expiresIn * 1000) - InterOauthClient.EXPIRY_MARGIN_MS,
    });
    return token;
  }

  private async requestToken(scope: string, credentials: BankPaymentCredentialsDto): Promise<InterOauthTokenDto> {
    this.assertCredentials(credentials);

    const material = InterCertLoader.loadFromPem(credentials.certPem, credentials.keyPem);
    const agent = new Agent({
      cert: material.cert,
      key: material.key,
      minVersion: 'TLSv1.2',
    });

    /* eslint-disable camelcase -- contrato form-urlencoded da API Inter */
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      scope,
    });
    /* eslint-enable camelcase */

    try {
      const result = await this.httpService.axiosRef.post<InterTokenResponseDto>(
        `${credentials.apiUrl}/oauth/v2/token`,
        body.toString(),
        {
          httpsAgent: agent,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );

      if (!result.data?.access_token || !result.data?.expires_in) {
        throw new ExternalApiError('Falha ao obter token OAuth no Banco Inter.');
      }

      return {
        accessToken: result.data.access_token,
        tokenType: result.data.token_type ?? 'Bearer',
        expiresIn: result.data.expires_in,
        scope: result.data.scope ?? scope,
      };
    }
    catch (error) {
      this.logger.error(LogContext.BANK_PAYMENT, {
        adapter: 'inter',
        action: 'oauth-token',
        scope,
        error: toLoggableHttpError(error),
      });

      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 401 || status === 403) {
        throw new PermanentProviderError(
          `Credencial OAuth do Banco Inter recusada (HTTP ${status}). Verifique clientId, clientSecret e o escopo no cadastro do banco.`,
        );
      }

      throw new TransientProviderError('Falha ao obter token OAuth no Banco Inter.');
    }
  }

  private assertCredentials(credentials: BankPaymentCredentialsDto): void {
    if (!credentials?.apiUrl?.trim()) {
      throw new InterOauthConfigError('URL da API Inter não está configurada no banco');
    }
    if (!credentials.clientId?.trim()) {
      throw new InterOauthConfigError('Client ID Inter não está configurado no banco');
    }
    if (!credentials.clientSecret?.trim()) {
      throw new InterOauthConfigError('Client secret Inter não está configurado no banco');
    }
  }

  private cacheKey(credentials: BankPaymentCredentialsDto, scope: string): string {
    return `${credentials.bankId}|${credentials.clientId}|${scope}`;
  }

  private normalizeScope(scope: string): string {
    return scope
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(' ');
  }
}
