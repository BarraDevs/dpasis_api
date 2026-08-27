import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { Agent } from 'node:https';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { toLoggableHttpError } from '../to-loggable-http-error';
import { InterOauthTokenDto } from './dtos/inter-oauth-token.dto';
import { InterTokenResponseDto } from './dtos/inter-token-response.dto';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';
import { InterCertLoader, type InterCertMaterial } from './inter-cert.loader';

type CachedToken = {
  token: InterOauthTokenDto;
  expiresAtMs: number;
};

@Injectable()
export class InterOauthClient {
  private static readonly EXPIRY_MARGIN_MS = 60_000;

  private readonly cache = new Map<string, CachedToken>();
  private readonly inflight = new Map<string, Promise<InterOauthTokenDto>>();
  private certMaterial: InterCertMaterial | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  public async getAccessToken(scope: string): Promise<InterOauthTokenDto> {
    const normalizedScope = this.normalizeScope(scope);
    if (!normalizedScope) {
      throw new InterOauthConfigError('Escopo OAuth do Banco Inter não pode ser vazio');
    }

    const cached = this.cache.get(normalizedScope);
    if (cached && cached.expiresAtMs > Date.now()) {
      return cached.token;
    }

    const pending = this.inflight.get(normalizedScope);
    if (pending) {
      return pending;
    }

    const request = this
      .fetchAndCache(normalizedScope)
      .finally(() => this.inflight.delete(normalizedScope));

    this.inflight.set(normalizedScope, request);
    return request;
  }

  private async fetchAndCache(normalizedScope: string): Promise<InterOauthTokenDto> {
    const token = await this.requestToken(normalizedScope);
    this.cache.set(normalizedScope, {
      token,
      expiresAtMs: Date.now() + (token.expiresIn * 1000) - InterOauthClient.EXPIRY_MARGIN_MS,
    });
    return token;
  }

  private async requestToken(scope: string): Promise<InterOauthTokenDto> {
    this.assertConfig();

    const material = this.getCertMaterial();
    const agent = new Agent({
      cert: material.cert,
      key: material.key,
      minVersion: 'TLSv1.2',
    });

    /* eslint-disable camelcase -- contrato form-urlencoded da API Inter */
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.configService.interClientId,
      client_secret: this.configService.interClientSecret,
      scope,
    });
    /* eslint-enable camelcase */

    try {
      const result = await this.httpService.axiosRef.post<InterTokenResponseDto>(
        `${this.configService.interApiUrl}/oauth/v2/token`,
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
      throw new ExternalApiError('Falha ao obter token OAuth no Banco Inter.');
    }
  }

  private assertConfig(): void {
    if (!this.configService.interApiUrl?.trim()) {
      throw new InterOauthConfigError('Variável de ambiente "INTER_API_URL" não está definida');
    }
    if (!this.configService.interClientId?.trim()) {
      throw new InterOauthConfigError('Variável de ambiente "INTER_CLIENT_ID" não está definida');
    }
    if (!this.configService.interClientSecret?.trim()) {
      throw new InterOauthConfigError('Variável de ambiente "INTER_CLIENT_SECRET" não está definida');
    }
  }

  private getCertMaterial(): InterCertMaterial {
    if (!this.certMaterial) {
      this.certMaterial = InterCertLoader.load(
        this.configService.interCertPath,
        this.configService.interKeyPath,
      );
    }
    return this.certMaterial;
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
