import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { Agent } from 'node:https';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentCredentialsDto } from '../../../dtos/bank-payment-credentials.dto';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import { ProviderAttemptOperation } from 'src/infra/provider-attempt/enums/provider-attempt-operation.enum';
import type { IProviderAttemptRecorder } from 'src/infra/provider-attempt/provider-attempt.gateway';
import { BankPaymentDto } from '../../../dtos/bank-payment.dto';
import { BankPaymentPdfDto } from '../../../dtos/bank-payment-pdf.dto';
import { CancelBankPaymentInputDto } from '../../../dtos/cancel-bank-payment.dto';
import { FindBankPaymentInputDto } from '../../../dtos/find-bank-payment.dto';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from '../../../dtos/issue-bank-payment.dto';
import { ListBankPaymentInputDto, ListBankPaymentOutputDto } from '../../../dtos/list-bank-payment.dto';
import { BankPaymentProvider } from '../../../enums/bank-payment-provider.enum';
import { BankPaymentAlreadyExistsError } from '../../../errors/bank-payment-already-exists.error';
import { BankPaymentNotFoundError } from '../../../errors/bank-payment-not-found.error';
import { BankPaymentRequestError } from '../../../errors/bank-payment-request.error';
import { InterCertLoader } from '../oauth/inter-cert.loader';
import { InterOauthClient } from '../oauth/inter-oauth.client';
import { toLoggableHttpError } from '../to-loggable-http-error';
import type {
  InterCobrancaDetalheDto,
  InterCobrancaListResponseDto,
  InterCobrancaPdfResponseDto,
  InterEmitirCobrancaResponseDto,
} from './dtos/inter-cobranca.dto';
import { InterCobrancaMapper } from './inter-cobranca.mapper';

@Injectable()
export class InterCobrancaClient {
  public static readonly OAUTH_SCOPE = 'boleto-cobranca.read boleto-cobranca.write';

  /**
   * A recusa por duplicidade vem como prosa em português, não como campo — casar pela forma
   * (`código de solicitação: <uuid>`) e nunca pelo texto exato, que o Inter pode reescrever.
   */
  private static readonly DUPLICATE_REQUEST_CODE_PATTERN = /c[óo]digo de solicita[çc][ãa]o:?\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

  constructor(
    private readonly httpService: HttpService,
    private readonly oauthClient: InterOauthClient,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.ProviderAttemptRecorder) private readonly attemptRecorder: IProviderAttemptRecorder,
  ) {}

  public async issue(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    const body = InterCobrancaMapper.toIssueRequest(input);

    try {
      const result = await this.request<InterEmitirCobrancaResponseDto>('POST', '/cobrancas', {
        body,
        action: 'issue',
        credentials: input.credentials,
        attempt: { nfseId: input.nfseId, operation: ProviderAttemptOperation.InterIssue },
      });

      if (!result?.codigoSolicitacao) {
        throw new ExternalApiError('Falha ao emitir cobrança no Banco Inter.');
      }

      return {
        provider: BankPaymentProvider.INTER,
        requestCode: result.codigoSolicitacao,
      };
    }
    catch (error) {
      throw this.mapThrownError(error);
    }
  }

  public async find(input: FindBankPaymentInputDto): Promise<BankPaymentDto> {
    try {
      const result = await this.request<InterCobrancaDetalheDto>(
        'GET',
        `/cobrancas/${encodeURIComponent(input.requestCode)}`,
        { action: 'find', requestCode: input.requestCode, credentials: input.credentials },
      );

      return InterCobrancaMapper.toBankPaymentDto(input.requestCode, result ?? {});
    }
    catch (error) {
      throw this.mapThrownError(error);
    }
  }

  public async list(input: ListBankPaymentInputDto): Promise<ListBankPaymentOutputDto> {
    try {
      const params = InterCobrancaMapper.toListQueryParams(input);
      const result = await this.request<InterCobrancaListResponseDto>(
        'GET',
        '/cobrancas',
        { action: 'list', params, credentials: input.credentials },
      );

      return InterCobrancaMapper.toListOutput(result ?? {});
    }
    catch (error) {
      throw this.mapThrownError(error);
    }
  }

  public async getPdf(input: FindBankPaymentInputDto): Promise<BankPaymentPdfDto> {
    try {
      const result = await this.request<InterCobrancaPdfResponseDto>(
        'GET',
        `/cobrancas/${encodeURIComponent(input.requestCode)}/pdf`,
        { action: 'getPdf', requestCode: input.requestCode, credentials: input.credentials },
      );

      if (!result?.pdf) {
        throw new ExternalApiError('Falha ao obter PDF da cobrança no Banco Inter.');
      }

      return InterCobrancaMapper.toPdfDto(input.requestCode, result);
    }
    catch (error) {
      throw this.mapThrownError(error);
    }
  }

  public async cancel(input: CancelBankPaymentInputDto): Promise<void> {
    const body = InterCobrancaMapper.toCancelRequest(input);

    try {
      await this.request<void>(
        'POST',
        `/cobrancas/${encodeURIComponent(input.requestCode)}/cancelar`,
        {
          body,
          action: 'cancel',
          requestCode: input.requestCode,
          credentials: input.credentials,
          accept: 'application/problem+json',
        },
      );
    }
    catch (error) {
      throw this.mapThrownError(error);
    }
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    options: {
      body?: unknown;
      action: string;
      requestCode?: string;
      accept?: string;
      params?: Record<string, string | number>;
      credentials: BankPaymentCredentialsDto;
      attempt?: { nfseId?: number; operation: ProviderAttemptOperation };
    },
  ): Promise<T> {
    const token = await this.oauthClient.getAccessToken(InterCobrancaClient.OAUTH_SCOPE, options.credentials);
    const agent = this.createHttpsAgent(options.credentials);
    const url = `${options.credentials.apiUrl}/cobranca/v3${path}`;
    const startedAt = Date.now();

    try {
      const result = await this.httpService.axiosRef.request<T>({
        method,
        url,
        data: options.body,
        params: options.params,
        httpsAgent: agent,
        headers: {
          Authorization: `${token.tokenType} ${token.accessToken}`,
          Accept: options.accept ?? 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });

      await this.recordAttempt(options.attempt, {
        requestBody: options.body,
        responseBody: result.data,
        httpStatus: result.status,
        durationMs: Date.now() - startedAt,
      });

      return result.data;
    }
    catch (error) {
      await this.recordAttempt(options.attempt, {
        requestBody: options.body,
        responseBody: isAxiosError(error) ? error.response?.data : undefined,
        httpStatus: isAxiosError(error) ? error.response?.status : undefined,
        durationMs: Date.now() - startedAt,
        errorClass: error instanceof Error ? error.name : 'UnknownError',
      });

      this.logger.error(LogContext.BANK_PAYMENT, {
        adapter: 'inter',
        action: options.action,
        requestCode: options.requestCode,
        error: toLoggableHttpError(error),
      });

      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          throw new BankPaymentNotFoundError(options.requestCode);
        }
        if (status && InterCobrancaClient.TRANSIENT_STATUSES.includes(status)) {
          throw new TransientProviderError(
            `Banco Inter indisponível no momento (HTTP ${status}).`,
            InterCobrancaClient.parseRetryAfter(error.response?.headers),
          );
        }
        if (status && status >= 500) {
          throw new TransientProviderError(`Banco Inter respondeu com erro ${status}.`);
        }
        if (status && status >= 400 && status < 500) {
          const message = this.extractInterErrorMessage(error.response?.data)
            ?? 'Requisição inválida na API de cobrança do Banco Inter.';
          const detail = this.extractInterErrorDetail(error.response?.data);

          // Só na emissão "já existe" significa vincular em vez de falhar. Em cancel/list, um UUID
          // no detail é prosa — não um 409 de cobrança duplicada.
          if (options.action === 'issue' && detail) {
            const existingRequestCode = InterCobrancaClient.DUPLICATE_REQUEST_CODE_PATTERN.exec(detail)?.[1];
            if (existingRequestCode) {
              throw new BankPaymentAlreadyExistsError(existingRequestCode, message);
            }
          }

          throw new PermanentProviderError(message);
        }
      }

      // Sem resposta HTTP: timeout, DNS, conexão cortada. Ambíguo por natureza — pode ter chegado.
      throw new TransientProviderError('Falha na comunicação com a API de cobrança do Banco Inter.');
    }
  }

  /**
   * Sem `nfseId` não há onde ancorar a linha — é o caso das rotas administrativas genéricas, que
   * consultam cobranças sem partir de uma NFS-e.
   */
  private async recordAttempt(
    attempt: { nfseId?: number; operation: ProviderAttemptOperation } | undefined,
    call: {
      requestBody?: unknown;
      responseBody?: unknown;
      httpStatus?: number;
      durationMs: number;
      errorClass?: string;
    },
  ): Promise<void> {
    if (!attempt?.nfseId) {
      return;
    }

    await this.attemptRecorder.record({
      nfseId: attempt.nfseId,
      operation: attempt.operation,
      requestBody: InterCobrancaClient.stringifyBody(call.requestBody),
      responseBody: InterCobrancaClient.stringifyBody(call.responseBody),
      httpStatus: call.httpStatus ?? null,
      durationMs: call.durationMs,
      errorClass: call.errorClass ?? null,
    });
  }

  private static stringifyBody(body: unknown): string | null {
    if (body === undefined || body === null) {
      return null;
    }
    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  /**
   * `429` e `408`/`425` são recusas de ritmo, não de conteúdo: o mesmo payload passa depois. A faixa
   * 4xx restante é o oposto — repetir só gasta tentativa.
   */
  private static readonly TRANSIENT_STATUSES = [408, 425, 429];

  private static parseRetryAfter(headers: unknown): number | undefined {
    const raw = (headers as Record<string, unknown> | undefined)?.['retry-after'];
    const seconds = Number(raw);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
  }

  private mapThrownError(error: unknown): Error {
    if (
      error instanceof BankPaymentNotFoundError
      || error instanceof BankPaymentAlreadyExistsError
      || error instanceof BankPaymentRequestError
      || error instanceof PermanentProviderError
      || error instanceof ExternalApiError
    ) {
      return error;
    }
    return new ExternalApiError('Falha na comunicação com a API de cobrança do Banco Inter.');
  }

  /**
   * O cache vive no `InterCertLoader`, com chave por `mtime`+tamanho: sobrescrever o certificado em
   * disco passa a valer sem reiniciar. Guardá-lo aqui, no campo da instância, tornava a troca a
   * quente impossível — e o certificado de sandbox vence dentro da janela de homologação.
   */
  private createHttpsAgent(credentials: BankPaymentCredentialsDto): Agent {
    const material = InterCertLoader.loadFromPem(credentials.certPem, credentials.keyPem);

    return new Agent({
      cert: material.cert,
      key: material.key,
      minVersion: 'TLSv1.2',
    });
  }

  /**
   * `detail` vem antes de `title` de propósito: o Inter preenche `title` com o genérico
   * "Requisição inválida" e põe em `detail` o que efetivamente resolve o incidente — inclusive o
   * código da cobrança já emitida. Na ordem anterior esse dado chegava à aplicação e era descartado.
   */
  private extractInterErrorMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.violacoes) && record.violacoes.length > 0) {
      const first = record.violacoes[0] as Record<string, unknown>;
      if (typeof first.razao === 'string') {
        return first.razao;
      }
    }
    if (typeof record.detail === 'string' && record.detail.trim()) {
      return record.detail;
    }
    if (typeof record.title === 'string' && record.title.trim()) {
      return record.title;
    }
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }

    return null;
  }

  private extractInterErrorDetail(data: unknown): string | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const detail = (data as Record<string, unknown>).detail;
    return typeof detail === 'string' ? detail : undefined;
  }
}
