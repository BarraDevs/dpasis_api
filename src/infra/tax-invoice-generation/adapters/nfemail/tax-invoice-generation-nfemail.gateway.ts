import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CancelTaxInvoiceInputDto } from '../../dtos/cancel-tax-invoice.dto';
import { FindAllTaxInvoicesInputDto, FindAllTaxInvoicesOutputDto } from '../../dtos/find-all-tax-invoices.dto';
import { IssueTaxInvoiceInputDto, IssueTaxInvoiceOutputDto } from '../../dtos/issue-tax-invoice.dto';
import { TaxInvoiceDto } from '../../dtos/tax-invoice.dto';
import { TaxInvoiceIssueFormat } from '../../enums/tax-invoice-issue-format.enum';
import { ITaxInvoiceGenerationGateway } from '../../tax-invoice-generation.gateway';
import { NfemailFindAllResponseDto, NfemailTaxInvoiceDto } from './dtos/nfemail.dto';
import { mapNfemailIssueResponse, mapNfemailToTaxInvoice } from './mappers/nfemail-tax-invoice.mapper';

@Injectable()
export class TaxInvoiceGenerationNfemailAdapterGateway implements ITaxInvoiceGenerationGateway {
  private static readonly MAX_LIMIT = 30;
  private static readonly MIN_CANCEL_REASON_LENGTH = 15;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async issue(input: IssueTaxInvoiceInputDto): Promise<IssueTaxInvoiceOutputDto> {
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

      const output: IssueTaxInvoiceOutputDto = { externalId };

      if (
        result.data
        && typeof result.data === 'object'
        && 'cod_nfemail' in (result.data as object)
        && 'cod_processo' in (result.data as object)
      ) {
        output.taxInvoice = mapNfemailToTaxInvoice(result.data as NfemailTaxInvoiceDto);
      }

      return output;
    }
    catch (error) {
      this.logger.error(LogContext.TAX_INVOICE_GENERATION, {
        adapter: 'nfemail',
        action: 'issue',
        format: input.format,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao emitir nota fiscal');
    }
  }

  public async findById(externalId: number): Promise<TaxInvoiceDto> {
    try {
      const result = await this.httpService.axiosRef.get<NfemailTaxInvoiceDto>(
        `${this.configService.nfemailApiUrl}/api/NotasFiscais`,
        {
          ...this.getAuthConfig(),
          params: { id: externalId },
        },
      );

      if (!result.data?.cod_nfemail) {
        throw new ExternalApiError('Nota fiscal não encontrada');
      }

      return mapNfemailToTaxInvoice(result.data);
    }
    catch (error) {
      this.logger.error(LogContext.TAX_INVOICE_GENERATION, {
        adapter: 'nfemail',
        action: 'findById',
        externalId,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao buscar nota fiscal');
    }
  }

  public async findAll(query: FindAllTaxInvoicesInputDto): Promise<FindAllTaxInvoicesOutputDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (limit > TaxInvoiceGenerationNfemailAdapterGateway.MAX_LIMIT) {
      throw new ExternalApiError(`Limite máximo de ${TaxInvoiceGenerationNfemailAdapterGateway.MAX_LIMIT} registros por página`);
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

      const rows = (result.data?.ListaNotaFiscal ?? []).map(mapNfemailToTaxInvoice);

      return {
        rows,
        page: result.data?.Paginacao?.page ?? page,
        limit: result.data?.Paginacao?.limit ?? limit,
        total: result.data?.Paginacao?.records ?? rows.length,
      };
    }
    catch (error) {
      this.logger.error(LogContext.TAX_INVOICE_GENERATION, {
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

  public async cancel(input: CancelTaxInvoiceInputDto): Promise<void> {
    if (!input.reason?.trim() || input.reason.trim().length < TaxInvoiceGenerationNfemailAdapterGateway.MIN_CANCEL_REASON_LENGTH) {
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
      this.logger.error(LogContext.TAX_INVOICE_GENERATION, {
        adapter: 'nfemail',
        action: 'cancel',
        externalId: input.externalId,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao cancelar nota fiscal');
    }
  }

  private getIssueRequest(input: IssueTaxInvoiceInputDto): { url: string; body: string } {
    const baseUrl = this.configService.nfemailApiUrl;

    if (input.format === TaxInvoiceIssueFormat.RPS_XML) {
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
