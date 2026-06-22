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
    catch (error) {
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
    catch (error) {
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

    console.log({ url, body });
    try {
      const result = await this.httpService.axiosRef.post<number>(url, body, {
        ...this.getAuthConfig(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log({ result: result.data });

      return { externalId: await this.resolveIssueExternalId(input, Number(result.data)) };
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

  // -------- AUXILIARES --------
  private async resolveIssueExternalId(input: IssueNfInputDto, postResponse: number): Promise<number> {
    if (Number.isInteger(postResponse) && postResponse > 0) {
      return postResponse;
    }

    // NFeMail pode retornar cod_processo (ex.: 0 = preparando assinatura) em vez de cod_nfemail.
    if (!Number.isInteger(postResponse)) {
      throw new ExternalApiError('NFeMail retornou resposta inválida ao emitir a nota fiscal');
    }

    const orderNumber = input.orderNumber?.trim() || input.fiscal.orderReference?.trim();
    if (!orderNumber) {
      throw new ExternalApiError(
        'NFeMail aceitou a nota, mas não retornou o código interno. Informe orderNumber ou fiscal.orderReference para consulta.',
      );
    }

    const notes = await this.findAll({ orderNumber, page: 1, limit: 1 });
    const externalId = notes[0]?.externalId;
    if (!externalId || externalId <= 0) {
      throw new ExternalApiError(
        'NFeMail não retornou o código interno da nota fiscal. Verifique o pedido no painel NFeMail.',
      );
    }

    return externalId;
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

    if (format === NfIssueFormat.RPS_XML) {
      return {
        url: `${baseUrl}/api/ArquivoXML`,
        body: `sXML=${encodeURIComponent(content)}`,
      };
    }

    return {
      url: `${baseUrl}/api/NotasFiscais`,
      body: `sTXT=${encodeURIComponent(content)}`,
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
