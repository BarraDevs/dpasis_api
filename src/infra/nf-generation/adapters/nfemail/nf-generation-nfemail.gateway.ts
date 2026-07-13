import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CancelNfInputDto } from '../../dtos/cancel-nf.dto';
import { FindAllNfInputDto } from '../../dtos/find-all-nf.dto';
import { IssueNfInputDto, IssueNfOutputDto } from '../../dtos/issue-nf.dto';
import { NfFileDto } from '../../dtos/nf-file.dto';
import { NfDto } from '../../dtos/nf.dto';
import { NfIssueFormat } from '../../enums/nf-issue-format.enum';
import { INfGenerationGateway } from '../../nf-generation.gateway';
import { NfemailFindAllQueryDto, NfemailFindAllResponseDto, NfemailTaxInvoiceDto } from './dtos/nfemail.dto';
import { buildNfemailIssueContent } from './mappers/nfemail-issue-content.mapper';
import { validateIssueNfInput } from './mappers/nfemail-issue-input.validator';
import { isNfseRpsKey, parseNfseRpsIdentificationFromKey } from './mappers/nfemail-nfse-rps-key.parser';

@Injectable()
export class NfGenerationNfemailAdapterGateway implements INfGenerationGateway {
  private static readonly MAX_LIMIT = 30;
  private static readonly ACCESS_KEY_LENGTH = 44;
  private static readonly MIN_CANCEL_REASON_LENGTH = 15;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // -------- NOTAS FISCAIS --------
  public async findAll(query: FindAllNfInputDto): Promise<NfDto[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (limit > NfGenerationNfemailAdapterGateway.MAX_LIMIT) {
      throw new ExternalApiError(`Limite máximo de ${NfGenerationNfemailAdapterGateway.MAX_LIMIT} registros por página`);
    }

    try {
      const params: NfemailFindAllQueryDto = { page, limit };
      if (query.orderNumber !== undefined) {
        params.pedido = query.orderNumber;
      }
      if (query.nfeNumber !== undefined) {
        params.numero = query.nfeNumber;
      }
      if (query.recipientDocument !== undefined) {
        params.cpfcnpj = query.recipientDocument;
      }
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

      return (result.data?.ListaNotaFiscal ?? []).map(this.mapNfemailToNf);
    }
    catch (error: any) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'findAll',
        query,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao listar notas fiscais');
    }
  }

  public async findById(externalId: number): Promise<NfDto> {
    try {
      const result = await this.httpService.axiosRef.get<NfemailTaxInvoiceDto>(
        `${this.configService.nfemailApiUrl}/api/NotasFiscais`,
        {
          ...this.getAuthConfig(),
          params: { id: externalId },
        },
      );

      return this.mapNfemailToNf(result.data);
    }
    catch (error: any) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'findById',
        externalId,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao buscar nota fiscal');
    }
  }

  public async issue(input: IssueNfInputDto): Promise<IssueNfOutputDto> {
    validateIssueNfInput(input);

    const content = buildNfemailIssueContent(input);
    const { url, body } = this.getIssueRequest(input.format, content);

    try {
      const result = await this.httpService.axiosRef.post<unknown>(url, body, {
        ...this.getAuthConfig(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const externalId = await this.resolveIssueExternalId(input, this.parseIssuePostResponse(result.data));

      return { externalId };
    }
    catch (error: any) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'issue',
        format: input.format,
        error,
      });
      throw new ExternalApiError(this.extractNfemailErrorMessage(error));
    }
  }

  // TODO: revisar ainda
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
    catch (error: any) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'cancel',
        externalId: input.externalId,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao cancelar nota fiscal');
    }
  }

  // -------- DANFE --------
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
    catch (error: any) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'getDanfe',
        accessKey: normalizedAccessKey,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao baixar DANFe');
    }
  }

  // -------- XML --------
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
    catch (error: any) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'getXml',
        accessKey: normalizedAccessKey,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao baixar XML da nota fiscal');
    }
  }

  // -------- AUXILIARES --------
  private async resolveIssueExternalId(input: IssueNfInputDto, postResponse: number | null): Promise<number> {
    if (Number.isInteger(postResponse) && postResponse! > 0) {
      return postResponse!;
    }

    const resolvedExternalId = await this.lookupIssueExternalId(input);
    if (resolvedExternalId) {
      return resolvedExternalId;
    }

    throw new ExternalApiError(
      'NFeMail importou a nota, mas não retornou o código interno. Consulte pelo número do RPS/NF-e no painel NFeMail ou tente novamente em instantes.',
    );
  }

  private async lookupIssueExternalId(input: IssueNfInputDto): Promise<number | null> {
    const queries = this.buildIssueExternalIdQueries(input);

    for (const query of queries) {
      const externalId = this.pickExternalId(input, await this.fetchNotasFiscais(query), query);
      if (externalId) {
        return externalId;
      }
    }

    if (input.format !== NfIssueFormat.RPS_XML) {
      return null;
    }

    await this.sleep(800);

    for (const query of queries) {
      const externalId = this.pickExternalId(input, await this.fetchNotasFiscais(query), query);
      if (externalId) {
        return externalId;
      }
    }

    return null;
  }

  private buildIssueExternalIdQueries(input: IssueNfInputDto): FindAllNfInputDto[] {
    const queries: FindAllNfInputDto[] = [];
    const orderNumber = input.orderNumber?.trim() || input.fiscal.orderReference?.trim();
    const documentNumber = input.fiscal.nfeNumber ?? 1;
    const recipientDocument = input.recipient.document?.trim();

    if (orderNumber) {
      queries.push({ orderNumber, page: 1, limit: 1 });
    }

    if (input.format === NfIssueFormat.RPS_XML) {
      if (recipientDocument) {
        queries.push({ recipientDocument, page: 1, limit: 30 });
      }

      return queries;
    }

    queries.push({ nfeNumber: documentNumber, page: 1, limit: 1 });

    return queries;
  }

  private pickExternalId(input: IssueNfInputDto, notes: NfDto[], query: FindAllNfInputDto): number | null {
    const matches = notes
      .filter((note) => this.matchesResolvedNote(input, note, query))
      .sort((left, right) => right.externalId - left.externalId);

    const externalId = matches[0]?.externalId;

    if (!externalId || externalId <= 0) {
      return null;
    }

    return externalId;
  }

  private matchesResolvedNote(input: IssueNfInputDto, note: NfDto, query: FindAllNfInputDto): boolean {
    if (input.format === NfIssueFormat.RPS_XML) {
      return this.matchesResolvedNfseNote(input, note, query);
    }

    const expectedNumber = input.fiscal.nfeNumber ?? 1;

    if (query.nfeNumber !== undefined && note.nfeNumber !== expectedNumber) {
      return false;
    }

    if (query.orderNumber !== undefined && note.orderNumber?.trim() !== query.orderNumber.trim()) {
      return false;
    }

    if (this.isNfeProduct(note)) {
      return false;
    }

    return true;
  }

  private matchesResolvedNfseNote(input: IssueNfInputDto, note: NfDto, query: FindAllNfInputDto): boolean {
    if (this.isNfeProduct(note)) {
      return false;
    }

    const expectedNumber = input.fiscal.nfeNumber ?? 1;
    const expectedSeries = input.fiscal.series;
    const recipientDocument = input.recipient.document?.replace(/\D/g, '') ?? '';
    const noteRecipientDocument = note.recipientDocument?.replace(/\D/g, '') ?? '';

    if (query.orderNumber !== undefined && note.orderNumber?.trim() !== query.orderNumber.trim()) {
      return false;
    }

    if (query.recipientDocument !== undefined && noteRecipientDocument !== recipientDocument) {
      return false;
    }

    const rpsIdentification = parseNfseRpsIdentificationFromKey(note.nfeKey);
    if (!rpsIdentification) {
      return false;
    }

    return rpsIdentification.number === expectedNumber && rpsIdentification.series === expectedSeries;
  }

  private isNfeProduct(note: NfDto): boolean {
    if (isNfseRpsKey(note.nfeKey)) {
      return false;
    }

    const accessKey = note.nfeKey?.replace(/\D/g, '') ?? '';

    return accessKey.length === NfGenerationNfemailAdapterGateway.ACCESS_KEY_LENGTH;
  }

  private async fetchNotasFiscais(query: FindAllNfInputDto): Promise<NfDto[]> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const params: NfemailFindAllQueryDto = { page, limit };

      if (query.orderNumber !== undefined) {
        params.pedido = query.orderNumber;
      }
      if (query.nfeNumber !== undefined) {
        params.numero = query.nfeNumber;
      }
      if (query.recipientDocument !== undefined) {
        params.cpfcnpj = query.recipientDocument;
      }
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

      return (result.data?.ListaNotaFiscal ?? []).map(this.mapNfemailToNf);
    }
    catch (error: any) {
      this.logger.error(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'fetchNotasFiscais',
        query,
        error,
      });

      return [];
    }
  }

  private parseIssuePostResponse(data: unknown): number | null {
    if (typeof data === 'number' && Number.isFinite(data)) {
      return data;
    }

    if (typeof data === 'string' && data.trim() !== '') {
      const parsed = Number(data.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private extractNfemailErrorMessage(error: any): string {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData.trim();
    }

    if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      return String(responseData.message);
    }

    return error?.message ?? 'Erro ao emitir nota fiscal';
  }

  private async sleep(milliseconds: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  private normalizeAccessKey(accessKey: string): string {
    const normalizedAccessKey = accessKey.replace(/\D/g, '');
    if (normalizedAccessKey.length !== NfGenerationNfemailAdapterGateway.ACCESS_KEY_LENGTH) {
      throw new ExternalApiError(`Chave de acesso deve conter ${NfGenerationNfemailAdapterGateway.ACCESS_KEY_LENGTH} dígitos`);
    }

    return normalizedAccessKey;
  }

  private getIssueRequest(format: NfIssueFormat, content: string): { url: string; body: string } {
    const baseUrl = this.configService.nfemailApiUrl;
    const encodedBody = `=${encodeURIComponent(content)}`;

    if (format === NfIssueFormat.SEFAZ_TXT) {
      return {
        url: `${baseUrl}/api/NotasFiscais`,
        body: encodedBody,
      };
    }

    return {
      url: `${baseUrl}/api/ArquivoXML`,
      body: encodedBody,
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

  private mapNfemailToNf(data: NfemailTaxInvoiceDto): NfDto {
    return {
      rowId: data.row_id,
      orderNumber: data.ped_numero ?? null,
      externalId: data.cod_nfemail,
      recipientDocument: data.num_cnpj ?? '',
      recipientFantasyName: data.nom_fantasia ?? '',
      recipientCompanyName: data.nom_razaosocial ?? '',
      processCode: data.cod_processo,
      processDescription: data.dsc_processo ?? '',
      nfeNumber: data.nfe_numero ?? null,
      nfeKey: data.nfe_chave?.trim() || null,
      totalValue: data.val_total ?? '',
      emissionDate: data.dat_emissao ?? '',
      authorizationDate: data.dat_autorizacao ?? '',
      cancellationCode: data.cod_cancelamento ?? '',
      cancellationDescription: data.dsc_cancelamento ?? '',
      cancellationReason: data.mot_cancelamento ?? '',
    };
  }
}
