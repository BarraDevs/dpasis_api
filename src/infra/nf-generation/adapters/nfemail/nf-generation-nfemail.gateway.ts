import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CancelNfInputDto } from '../../dtos/cancel-nf.dto';
import { IssueCorrectionLetterInputDto } from '../../dtos/correction-letter.dto';
import { FindAllNfInvalidationsInputDto, FindAllNfInvalidationsOutputDto } from '../../dtos/find-all-invalidations.dto';
import { FindAllNfInputDto, FindAllNfOutputDto } from '../../dtos/find-all-nf.dto';
import { InvalidateNfNumbersInputDto, InvalidateNfNumbersOutputDto } from '../../dtos/invalidate-numbers.dto';
import { IssueNfInputDto, IssueNfOutputDto } from '../../dtos/issue-nf.dto';
import { NfFileDto } from '../../dtos/nf-file.dto';
import { NfDto } from '../../dtos/nf.dto';
import { NfIssueFormat } from '../../enums/nf-issue-format.enum';
import { INfGenerationGateway } from '../../nf-generation.gateway';
import { NfemailFindAllInvalidationsResponseDto, NfemailFindAllResponseDto, NfemailInvalidationResultDto, NfemailTaxInvoiceDto } from './dtos/nfemail.dto';
import {
  extractNfemailInvalidations,
  extractNfemailPagination,
  extractNfemailTaxInvoices,
  mapNfemailInvalidation,
  mapNfemailInvalidationResult,
  mapNfemailIssueResponse,
  mapNfemailToNf,
} from './mappers/nfemail-nf.mapper';

@Injectable()
export class NfGenerationNfemailAdapterGateway implements INfGenerationGateway {
  private static readonly MAX_LIMIT = 30;
  private static readonly ACCESS_KEY_LENGTH = 44;
  private static readonly MIN_CANCEL_REASON_LENGTH = 15;
  private static readonly MAX_CORRECTION_REASON_LENGTH = 1000;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async findAll(query: FindAllNfInputDto): Promise<FindAllNfOutputDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (limit > NfGenerationNfemailAdapterGateway.MAX_LIMIT) {
      throw new ExternalApiError(`Limite máximo de ${NfGenerationNfemailAdapterGateway.MAX_LIMIT} registros por página`);
    }

    try {
      const params: Record<string, number> = { page, limit };
      if (query.processCode !== undefined) {
        params.status = query.processCode;
      }

      const result = await this.httpService.axiosRef.get<NfemailFindAllResponseDto>(
        `${this.configService.nfemailApiUrl}/api/NotasFiscais`,
        {
          ...this.getAuthConfig(),
          params,
        },
      );

      const rows = (result.data?.ListaNotaFiscal ?? []).map(mapNfemailToNf);
      const pagination = extractNfemailPagination(result.data, page, limit, rows.length);

      return {
        rows,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
      };
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'findAll',
        page,
        limit,
        processCode: query.processCode,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao listar notas fiscais');
    }
  }

  public async findById(externalId: number): Promise<NfDto> {
    return this.findSingleNf({ id: externalId }, 'findById', { externalId });
  }

  public async findByNumber(invoiceNumber: number): Promise<NfDto> {
    return this.findSingleNf({ numero: invoiceNumber }, 'findByNumber');
  }

  public async findByOrderCode(orderCode: string): Promise<NfDto> {
    if (!orderCode?.trim()) {
      throw new ExternalApiError('Código do pedido é obrigatório');
    }

    return this.findSingleNf({ pedido: orderCode.trim() }, 'findByOrderCode');
  }

  public async findByDocument(document: string): Promise<NfDto[]> {
    const normalizedDocument = document.replace(/\D/g, '');
    if (!normalizedDocument) {
      throw new ExternalApiError('CPF/CNPJ é obrigatório');
    }

    try {
      const result = await this.httpService.axiosRef.get<unknown>(
        `${this.configService.nfemailApiUrl}/api/NotasFiscais`,
        {
          ...this.getAuthConfig(),
          params: { cpfcnpj: normalizedDocument },
        },
      );

      const rows = extractNfemailTaxInvoices(result.data).map(mapNfemailToNf);
      if (!rows.length) {
        throw new ExternalApiError('Nota fiscal não encontrada');
      }

      return rows;
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'findByDocument',
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao buscar nota fiscal por documento');
    }
  }

  public async issue(input: IssueNfInputDto): Promise<IssueNfOutputDto> {
    if (!input.content?.trim()) {
      throw new ExternalApiError('Conteúdo da nota fiscal é obrigatório');
    }

    const { url, body } = this.getIssueRequest(input);

    try {
      const result = await this.httpService.axiosRef.post<unknown>(url, body, {
        ...this.getAuthConfig(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const externalId = mapNfemailIssueResponse(result.data);
      if (externalId === null) {
        throw new ExternalApiError('Resposta inválida da API de emissão de nota fiscal');
      }

      const output: IssueNfOutputDto = { externalId };

      if (
        result.data
        && typeof result.data === 'object'
        && 'cod_nfemail' in (result.data as object)
        && 'cod_processo' in (result.data as object)
      ) {
        output.nf = mapNfemailToNf(result.data as NfemailTaxInvoiceDto);
      }

      return output;
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'issue',
        format: input.format,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao emitir nota fiscal');
    }
  }

  public async cancel(input: CancelNfInputDto): Promise<void> {
    if (!input.reason?.trim() || input.reason.trim().length < NfGenerationNfemailAdapterGateway.MIN_CANCEL_REASON_LENGTH) {
      throw new ExternalApiError('Motivo do cancelamento deve ter no mínimo 15 caracteres');
    }

    try {
      await this.httpService.axiosRef.delete(
        `${this.configService.nfemailApiUrl}/api/DANFe`,
        {
          ...this.getAuthConfig(),
          params: {
            id: input.externalId,
            motivo: input.reason.trim(),
          },
        },
      );
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'cancel',
        externalId: input.externalId,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao cancelar nota fiscal');
    }
  }

  public async getDanfe(accessKey: string): Promise<NfFileDto> {
    const normalizedAccessKey = this.normalizeAccessKey(accessKey);

    try {
      const result = await this.httpService.axiosRef.get<ArrayBuffer>(
        `${this.configService.nfemailApiUrl}/api/DANFe`,
        {
          ...this.getAuthConfig(),
          params: { chave: normalizedAccessKey },
          responseType: 'arraybuffer',
        },
      );

      const buffer = Buffer.from(result.data);
      if (!buffer.length) {
        throw new ExternalApiError('DANFe não encontrado');
      }

      return {
        content: buffer.toString('base64'),
        mimeType: 'application/pdf',
        fileName: `DANFe-${normalizedAccessKey}.pdf`,
      };
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'getDanfe',
        accessKey: normalizedAccessKey,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao baixar DANFe');
    }
  }

  public async getXml(accessKey: string): Promise<NfFileDto> {
    const normalizedAccessKey = this.normalizeAccessKey(accessKey);

    try {
      const result = await this.httpService.axiosRef.get<string>(
        `${this.configService.nfemailApiUrl}/api/ArquivoXML`,
        {
          ...this.getAuthConfig(),
          params: { chave: normalizedAccessKey },
        },
      );

      if (!result.data?.trim()) {
        throw new ExternalApiError('XML da nota fiscal não encontrado');
      }

      return {
        content: result.data,
        mimeType: 'application/xml',
        fileName: `NotaFiscal-${normalizedAccessKey}.xml`,
      };
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'getXml',
        accessKey: normalizedAccessKey,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao baixar XML da nota fiscal');
    }
  }

  public async issueCorrectionLetter(input: IssueCorrectionLetterInputDto): Promise<void> {
    const normalizedAccessKey = this.normalizeAccessKey(input.accessKey);
    const reason = input.reason?.trim() ?? '';

    if (reason.length < NfGenerationNfemailAdapterGateway.MIN_CANCEL_REASON_LENGTH) {
      throw new ExternalApiError('Motivo da carta de correção deve ter no mínimo 15 caracteres');
    }

    if (reason.length > NfGenerationNfemailAdapterGateway.MAX_CORRECTION_REASON_LENGTH) {
      throw new ExternalApiError('Motivo da carta de correção deve ter no máximo 1000 caracteres');
    }

    try {
      await this.httpService.axiosRef.post(
        `${this.configService.nfemailApiUrl}/api/NFeCorrigidas`,
        null,
        {
          ...this.getAuthConfig(),
          params: {
            chave: normalizedAccessKey,
            sequencia: input.sequence,
            motivo: reason,
          },
        },
      );
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'issueCorrectionLetter',
        accessKey: normalizedAccessKey,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao emitir carta de correção');
    }
  }

  public async getCorrectionLetterXml(accessKey: string): Promise<NfFileDto> {
    const normalizedAccessKey = this.normalizeAccessKey(accessKey);

    try {
      const result = await this.httpService.axiosRef.get<string>(
        `${this.configService.nfemailApiUrl}/api/NFeCorrigidas`,
        {
          ...this.getAuthConfig(),
          params: { chave: normalizedAccessKey },
        },
      );

      if (!result.data?.trim()) {
        throw new ExternalApiError('XML da carta de correção não encontrado');
      }

      return {
        content: result.data,
        mimeType: 'application/xml',
        fileName: `CCe-${normalizedAccessKey}.xml`,
      };
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'getCorrectionLetterXml',
        accessKey: normalizedAccessKey,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao baixar XML da carta de correção');
    }
  }

  public async invalidateNumbers(input: InvalidateNfNumbersInputDto): Promise<InvalidateNfNumbersOutputDto> {
    const reason = input.reason?.trim() ?? '';

    if (reason.length < NfGenerationNfemailAdapterGateway.MIN_CANCEL_REASON_LENGTH) {
      throw new ExternalApiError('Motivo da inutilização deve ter no mínimo 15 caracteres');
    }

    try {
      const result = await this.httpService.axiosRef.post<NfemailInvalidationResultDto>(
        `${this.configService.nfemailApiUrl}/api/Inutilizadas`,
        null,
        {
          ...this.getAuthConfig(),
          params: {
            ambiente: input.environment,
            ano: input.year,
            serie: input.series,
            numInicial: input.startNumber,
            numFinal: input.endNumber,
            motivo: reason,
          },
        },
      );

      if (!result.data || typeof result.data.cod_retorno !== 'number') {
        throw new ExternalApiError('Resposta inválida da API de inutilização');
      }

      return mapNfemailInvalidationResult(result.data);
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'invalidateNumbers',
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao inutilizar numeração');
    }
  }

  public async findAllInvalidations(query: FindAllNfInvalidationsInputDto): Promise<FindAllNfInvalidationsOutputDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (limit > NfGenerationNfemailAdapterGateway.MAX_LIMIT) {
      throw new ExternalApiError(`Limite máximo de ${NfGenerationNfemailAdapterGateway.MAX_LIMIT} registros por página`);
    }

    try {
      const result = await this.httpService.axiosRef.get<NfemailFindAllInvalidationsResponseDto>(
        `${this.configService.nfemailApiUrl}/api/Inutilizadas`,
        {
          ...this.getAuthConfig(),
          params: {
            ano: query.year,
            page,
            limit,
          },
        },
      );

      const rows = extractNfemailInvalidations(result.data).map(mapNfemailInvalidation);
      const pagination = extractNfemailPagination(result.data, page, limit, rows.length);

      return {
        rows,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
      };
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'findAllInvalidations',
        page,
        limit,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao listar inutilizações');
    }
  }

  private async findSingleNf(
    params: Record<string, string | number>,
    action: string,
    logContext: { externalId?: number } = {},
  ): Promise<NfDto> {
    try {
      const result = await this.httpService.axiosRef.get<unknown>(
        `${this.configService.nfemailApiUrl}/api/NotasFiscais`,
        {
          ...this.getAuthConfig(),
          params,
        },
      );

      const rows = extractNfemailTaxInvoices(result.data);
      if (!rows.length || !rows[0]?.cod_nfemail) {
        throw new ExternalApiError('Nota fiscal não encontrada');
      }

      return mapNfemailToNf(rows[0]);
    }
    catch (error) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action,
        ...logContext,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao buscar nota fiscal');
    }
  }

  private normalizeAccessKey(accessKey: string): string {
    const normalizedAccessKey = accessKey.replace(/\D/g, '');
    if (normalizedAccessKey.length !== NfGenerationNfemailAdapterGateway.ACCESS_KEY_LENGTH) {
      throw new ExternalApiError('Chave de acesso deve conter 44 dígitos');
    }

    return normalizedAccessKey;
  }

  private getIssueRequest(input: IssueNfInputDto): { url: string; body: string } {
    const baseUrl = this.configService.nfemailApiUrl;

    if (input.format === NfIssueFormat.RPS_XML) {
      return {
        url: `${baseUrl}/api/ArquivoXML`,
        body: `sXML=${encodeURIComponent(input.content)}`,
      };
    }

    return {
      url: `${baseUrl}/api/NotasFiscais`,
      body: `sTXT=${encodeURIComponent(input.content)}`,
    };
  }

  private getAuthConfig() {
    return {
      auth: {
        username: this.configService.nfemailCnpj,
        password: this.configService.nfemailApiKey,
      },
    };
  }
}
