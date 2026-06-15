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

  // TODO: revisar ainda
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

      const externalId = this.mapNfemailIssueResponse(result.data);
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
        output.nf = this.mapNfemailToNf(result.data as NfemailTaxInvoiceDto);
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
  private normalizeAccessKey(accessKey: string): string {
    const normalizedAccessKey = accessKey.replace(/\D/g, '');
    if (normalizedAccessKey.length !== NfGenerationNfemailAdapterGateway.ACCESS_KEY_LENGTH) {
      throw new ExternalApiError(`Chave de acesso deve conter ${NfGenerationNfemailAdapterGateway.ACCESS_KEY_LENGTH} dígitos`);
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

  private mapNfemailIssueResponse(data: unknown): number | null {
    if (typeof data === 'number' && Number.isFinite(data)) {
      return data;
    }

    if (typeof data === 'string' && data.trim()) {
      const parsed = Number(data.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const candidates = [
        record.cod_nfemail,
        record.CodNfemail,
        record.id,
        record.Id,
      ];

      for (const candidate of candidates) {
        if (typeof candidate === 'number' && Number.isFinite(candidate)) {
          return candidate;
        }
        if (typeof candidate === 'string' && candidate.trim()) {
          const parsed = Number(candidate.trim());
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }

      if ('cod_nfemail' in record) {
        const externalId = record.cod_nfemail;
        if (typeof externalId === 'number' && Number.isFinite(externalId)) {
          return externalId;
        }
        if (typeof externalId === 'string' && externalId.trim()) {
          const parsed = Number(externalId.trim());
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }
    }

    return null;
  }
}
