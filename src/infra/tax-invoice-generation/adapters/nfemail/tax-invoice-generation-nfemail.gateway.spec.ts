/* eslint-disable camelcase */
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { TaxInvoiceIssueFormat } from '../../enums/tax-invoice-issue-format.enum';
import { NfemailFindAllResponseDto, NfemailTaxInvoiceDto } from './dtos/nfemail.dto';
import { TaxInvoiceGenerationNfemailAdapterGateway } from './tax-invoice-generation-nfemail.gateway';

describe('TaxInvoiceGenerationNfemailAdapterGateway', () => {
  let sut: TaxInvoiceGenerationNfemailAdapterGateway;
  let httpService: jest.Mocked<HttpService>;
  let logger: jest.Mocked<ILoggerGateway>;

  const API_URL = 'https://api.nfemail.com.br';
  const CNPJ = '12345678000199';
  const API_KEY = 'secret-key';
  const AUTH_CONFIG = {
    auth: {
      username: CNPJ,
      password: API_KEY,
    },
  };

  const makeNfemailTaxInvoice = (overrides: Partial<NfemailTaxInvoiceDto> = {}): NfemailTaxInvoiceDto => createMock<NfemailTaxInvoiceDto>({
    row_id: 1,
    nfe_numero: 100,
    ped_numero: 200,
    cod_nfemail: 42,
    num_cnpj: '98765432000111',
    nom_fantasia: 'Cliente Teste',
    nom_razaosocial: 'Cliente Teste LTDA',
    cod_processo: 100,
    dsc_processo: 'autorizada',
    nfe_chave: '35260112345678000199550010000001001000000010',
    ...overrides,
  });

  beforeEach(async() => {
    const mockHttpService = {
      axiosRef: {
        post: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockConfigService = {
      nfemailApiUrl: API_URL,
      nfemailCnpj: CNPJ,
      nfemailApiKey: API_KEY,
    };

    const mockLogger = {
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxInvoiceGenerationNfemailAdapterGateway,
        {
          provide: TOKENS.LoggerGateway,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    sut = module.get<TaxInvoiceGenerationNfemailAdapterGateway>(TaxInvoiceGenerationNfemailAdapterGateway);
    httpService = module.get(HttpService);
    logger = module.get(TOKENS.LoggerGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('issue', () => {
    it('should throw ExternalApiError when content is empty', async() => {
      await expect(sut.issue({
        content: '   ',
        format: TaxInvoiceIssueFormat.SEFAZ_TXT,
      })).rejects.toThrow(ExternalApiError);
      await expect(sut.issue({
        content: '   ',
        format: TaxInvoiceIssueFormat.SEFAZ_TXT,
      })).rejects.toThrow('Conteúdo da nota fiscal é obrigatório');

      expect(httpService.axiosRef.post).not.toHaveBeenCalled();
    });

    it('should issue SEFAZ TXT with sTXT body and basic auth', async() => {
      const content = 'NOTAFISCAL|1.0|...';
      const taxInvoice = makeNfemailTaxInvoice();
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: taxInvoice });

      const result = await sut.issue({
        content,
        format: TaxInvoiceIssueFormat.SEFAZ_TXT,
      });

      expect(httpService.axiosRef.post).toHaveBeenCalledWith(
        `${API_URL}/api/NotasFiscais`,
        `sTXT=${encodeURIComponent(content)}`,
        {
          ...AUTH_CONFIG,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      expect(result).toEqual({
        externalId: 42,
        taxInvoice: {
          externalId: 42,
          rowId: 1,
          number: 100,
          orderCode: 200,
          recipientDocument: '98765432000111',
          fantasyName: 'Cliente Teste',
          companyName: 'Cliente Teste LTDA',
          processCode: 100,
          processDescription: 'autorizada',
          accessKey: '35260112345678000199550010000001001000000010',
        },
      });
    });

    it('should issue RPS XML with sXML body', async() => {
      const content = '<Rps>...</Rps>';
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: { cod_nfemail: 99 } as NfemailTaxInvoiceDto });

      const result = await sut.issue({
        content,
        format: TaxInvoiceIssueFormat.RPS_XML,
      });

      expect(httpService.axiosRef.post).toHaveBeenCalledWith(
        `${API_URL}/api/ArquivoXML`,
        `sXML=${encodeURIComponent(content)}`,
        {
          ...AUTH_CONFIG,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      expect(result).toEqual({ externalId: 99 });
    });

    it('should parse numeric issue response', async() => {
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: 77 });

      const result = await sut.issue({
        content: 'txt',
        format: TaxInvoiceIssueFormat.SEFAZ_TXT,
      });

      expect(result).toEqual({ externalId: 77 });
    });

    it('should throw ExternalApiError when issue response is invalid', async() => {
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: {} });

      await expect(sut.issue({
        content: 'txt',
        format: TaxInvoiceIssueFormat.SEFAZ_TXT,
      })).rejects.toThrow(ExternalApiError);

      expect(logger.error).toHaveBeenCalledWith(LogContext.TAX_INVOICE_GENERATION, expect.objectContaining({
        adapter: 'nfemail',
        action: 'issue',
      }));
    });

    it('should log and throw ExternalApiError on HTTP failure', async() => {
      const error = new Error('timeout');
      httpService.axiosRef.post = jest.fn().mockRejectedValue(error);

      await expect(sut.issue({
        content: 'txt',
        format: TaxInvoiceIssueFormat.SEFAZ_TXT,
      })).rejects.toThrow(ExternalApiError);

      expect(logger.error).toHaveBeenCalledWith(LogContext.TAX_INVOICE_GENERATION, {
        adapter: 'nfemail',
        action: 'issue',
        format: TaxInvoiceIssueFormat.SEFAZ_TXT,
        error,
      });
    });
  });

  describe('findById', () => {
    it('should return mapped tax invoice when found', async() => {
      const taxInvoice = makeNfemailTaxInvoice();
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: taxInvoice });

      const result = await sut.findById(42);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/NotasFiscais`,
        {
          ...AUTH_CONFIG,
          params: { id: 42 },
        },
      );
      expect(result.externalId).toBe(42);
      expect(result.processDescription).toBe('autorizada');
    });

    it('should throw ExternalApiError when tax invoice is not found', async() => {
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: {} });

      await expect(sut.findById(42)).rejects.toThrow(ExternalApiError);
      await expect(sut.findById(42)).rejects.toThrow('Nota fiscal não encontrada');

      expect(logger.error).toHaveBeenCalledWith(LogContext.TAX_INVOICE_GENERATION, expect.objectContaining({
        adapter: 'nfemail',
        action: 'findById',
        externalId: 42,
      }));
    });
  });

  describe('findAll', () => {
    it('should throw ExternalApiError when limit is greater than 30', async() => {
      await expect(sut.findAll({ limit: 31 })).rejects.toThrow(ExternalApiError);
      await expect(sut.findAll({ limit: 31 })).rejects.toThrow('Limite máximo de 30 registros por página');

      expect(httpService.axiosRef.get).not.toHaveBeenCalled();
    });

    it('should return paginated tax invoices', async() => {
      const response = createMock<NfemailFindAllResponseDto>({
        ListaNotaFiscal: [makeNfemailTaxInvoice()],
        Paginacao: {
          page: 2,
          limit: 5,
          records: 12,
        },
      });
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: response });

      const result = await sut.findAll({ page: 2, limit: 5, processCode: 100 });

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/NotasFiscais`,
        {
          ...AUTH_CONFIG,
          params: {
            page: 2,
            limit: 5,
            status: 100,
          },
        },
      );
      expect(result).toEqual({
        rows: [expect.objectContaining({ externalId: 42 })],
        page: 2,
        limit: 5,
        total: 12,
      });
    });

    it('should log and throw ExternalApiError on HTTP failure', async() => {
      const error = new Error('network error');
      httpService.axiosRef.get = jest.fn().mockRejectedValue(error);

      await expect(sut.findAll({ page: 1, limit: 10 })).rejects.toThrow(ExternalApiError);

      expect(logger.error).toHaveBeenCalledWith(LogContext.TAX_INVOICE_GENERATION, {
        adapter: 'nfemail',
        action: 'findAll',
        page: 1,
        limit: 10,
        processCode: undefined,
        error,
      });
    });
  });

  describe('cancel', () => {
    it('should throw ExternalApiError when reason is shorter than 15 characters', async() => {
      await expect(sut.cancel({
        externalId: 42,
        reason: 'curto',
      })).rejects.toThrow(ExternalApiError);
      await expect(sut.cancel({
        externalId: 42,
        reason: 'curto',
      })).rejects.toThrow('Motivo do cancelamento deve ter no mínimo 15 caracteres');

      expect(httpService.axiosRef.delete).not.toHaveBeenCalled();
    });

    it('should cancel tax invoice with encoded reason', async() => {
      httpService.axiosRef.delete = jest.fn().mockResolvedValue({ data: {} });
      const reason = 'Cancelamento por erro de emissao';

      await sut.cancel({
        externalId: 42,
        reason,
      });

      expect(httpService.axiosRef.delete).toHaveBeenCalledWith(
        `${API_URL}/api/DANFe`,
        {
          ...AUTH_CONFIG,
          params: {
            id: 42,
            motivo: reason,
          },
        },
      );
    });

    it('should log and throw ExternalApiError on HTTP failure', async() => {
      const error = new Error('cancel failed');
      httpService.axiosRef.delete = jest.fn().mockRejectedValue(error);

      await expect(sut.cancel({
        externalId: 42,
        reason: 'Cancelamento por erro de emissao',
      })).rejects.toThrow(ExternalApiError);

      expect(logger.error).toHaveBeenCalledWith(LogContext.TAX_INVOICE_GENERATION, {
        adapter: 'nfemail',
        action: 'cancel',
        externalId: 42,
        error,
      });
    });
  });
});
