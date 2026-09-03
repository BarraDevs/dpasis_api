import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { Agent } from 'node:https';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
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
import { InterCertLoader, type InterCertMaterial } from '../oauth/inter-cert.loader';
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

  private certMaterial: InterCertMaterial | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly oauthClient: InterOauthClient,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  public async issue(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    const body = InterCobrancaMapper.toIssueRequest(input);

    try {
      const result = await this.request<InterEmitirCobrancaResponseDto>('POST', '/cobrancas', {
        body,
        action: 'issue',
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
      throw this.mapThrownError(this.asAlreadyExistsError(error) ?? error);
    }
  }

  public async find(input: FindBankPaymentInputDto): Promise<BankPaymentDto> {
    try {
      const result = await this.request<InterCobrancaDetalheDto>(
        'GET',
        `/cobrancas/${encodeURIComponent(input.requestCode)}`,
        { action: 'find', requestCode: input.requestCode },
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
        { action: 'list', params },
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
        { action: 'getPdf', requestCode: input.requestCode },
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
    },
  ): Promise<T> {
    const token = await this.oauthClient.getAccessToken(InterCobrancaClient.OAUTH_SCOPE);
    const agent = this.createHttpsAgent();
    const url = `${this.configService.interApiUrl}/cobranca/v3${path}`;

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

      return result.data;
    }
    catch (error) {
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
        if (status && status >= 400 && status < 500) {
          const message = this.extractInterErrorMessage(error.response?.data)
            ?? 'Requisição inválida na API de cobrança do Banco Inter.';

          throw new BankPaymentRequestError(message, this.extractInterErrorDetail(error.response?.data));
        }
      }

      throw new ExternalApiError('Falha na comunicação com a API de cobrança do Banco Inter.');
    }
  }

  private mapThrownError(error: unknown): Error {
    if (
      error instanceof BankPaymentNotFoundError
      || error instanceof BankPaymentAlreadyExistsError
      || error instanceof BankPaymentRequestError
      || error instanceof ExternalApiError
    ) {
      return error;
    }
    return new ExternalApiError('Falha na comunicação com a API de cobrança do Banco Inter.');
  }

  private createHttpsAgent(): Agent {
    const material = this.getCertMaterial();
    return new Agent({
      cert: material.cert,
      key: material.key,
      minVersion: 'TLSv1.2',
    });
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

  /**
   * Dentro da janela de idempotência implícita de 30 min, o Inter recusa a segunda emissão com
   * HTTP 400 e devolve o `codigoSolicitacao` da cobrança que já criou. Sem traduzir isso, o job
   * morreria com erro permanente **depois** de o boleto existir, deixando uma cobrança viva e
   * cobrável sem vínculo local.
   *
   * Vive aqui, chamado só por `issue`, e não no tratamento genérico de 4xx: é na emissão que "já
   * existe" significa vincular em vez de falhar. Aplicado a toda operação, qualquer mensagem com um
   * UUID — a recusa de cancelamento de uma cobrança já paga, por exemplo — viraria um 409
   * "cobrança já emitida".
   */
  private asAlreadyExistsError(error: unknown): BankPaymentAlreadyExistsError | null {
    if (!(error instanceof BankPaymentRequestError) || !error.detail) {
      return null;
    }

    const existingRequestCode = InterCobrancaClient.DUPLICATE_REQUEST_CODE_PATTERN.exec(error.detail)?.[1];
    if (!existingRequestCode) {
      return null;
    }

    return new BankPaymentAlreadyExistsError(existingRequestCode, error.message);
  }
}
