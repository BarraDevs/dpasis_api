/* eslint-disable camelcase */
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfEnvironment } from '../../enums/nf-environment.enum';
import { NfIssueFormat } from '../../enums/nf-issue-format.enum';
import { NfemailFindAllInvalidationsResponseDto, NfemailFindAllResponseDto, NfemailInvalidationResultDto, NfemailTaxInvoiceDto } from './dtos/nfemail.dto';
import { NfGenerationNfemailAdapterGateway } from './nf-generation-nfemail.gateway';

describe('NfGenerationNfemailAdapterGateway', () => {
  let sut: NfGenerationNfemailAdapterGateway;
  let httpService: jest.Mocked<HttpService>;
  let logger: jest.Mocked<ILoggerGateway>;

  const API_URL = 'https://api.nfemail.com.br';
  const CNPJ = '12345678000199';
  const API_KEY = 'secret-key';
  const ACCESS_KEY = '35260112345678000199550010000001001000000010';
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
    nfe_chave: ACCESS_KEY,
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
        NfGenerationNfemailAdapterGateway,
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

    sut = module.get<NfGenerationNfemailAdapterGateway>(NfGenerationNfemailAdapterGateway);
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
        format: NfIssueFormat.SEFAZ_TXT,
      })).rejects.toThrow(ExternalApiError);
      await expect(sut.issue({
        content: '   ',
        format: NfIssueFormat.SEFAZ_TXT,
      })).rejects.toThrow('Conteúdo da nota fiscal é obrigatório');

      expect(httpService.axiosRef.post).not.toHaveBeenCalled();
    });

    it('should issue SEFAZ TXT with sTXT body and basic auth', async() => {
      const content = 'NOTAFISCAL|1.0|...';
      const nf = makeNfemailTaxInvoice();
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: nf });

      const result = await sut.issue({
        content,
        format: NfIssueFormat.SEFAZ_TXT,
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
        nf: {
          externalId: 42,
          rowId: 1,
          number: 100,
          orderCode: 200,
          recipientDocument: '98765432000111',
          fantasyName: 'Cliente Teste',
          companyName: 'Cliente Teste LTDA',
          processCode: 100,
          processDescription: 'autorizada',
          accessKey: ACCESS_KEY,
        },
      });
    });

    it('should issue RPS XML with sXML body', async() => {
      const content = '<Rps>...</Rps>';
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: { cod_nfemail: 99 } as NfemailTaxInvoiceDto });

      const result = await sut.issue({
        content,
        format: NfIssueFormat.RPS_XML,
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

    it('should log and throw ExternalApiError on HTTP failure', async() => {
      const error = new Error('timeout');
      httpService.axiosRef.post = jest.fn().mockRejectedValue(error);

      await expect(sut.issue({
        content: 'txt',
        format: NfIssueFormat.SEFAZ_TXT,
      })).rejects.toThrow(ExternalApiError);

      expect(logger.error).toHaveBeenCalledWith(LogContext.NF_GENERATION, {
        adapter: 'nfemail',
        action: 'issue',
        format: NfIssueFormat.SEFAZ_TXT,
        error,
      });
    });
  });

  describe('findById', () => {
    it('should return mapped nf when found', async() => {
      const nf = makeNfemailTaxInvoice();
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: nf });

      const result = await sut.findById(42);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/NotasFiscais`,
        {
          ...AUTH_CONFIG,
          params: { id: 42 },
        },
      );
      expect(result.externalId).toBe(42);
    });

    it('should throw ExternalApiError when nf is not found', async() => {
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: {} });

      await expect(sut.findById(42)).rejects.toThrow(ExternalApiError);
      await expect(sut.findById(42)).rejects.toThrow('Nota fiscal não encontrada');
    });
  });

  describe('findByNumber', () => {
    it('should query by numero param', async() => {
      const nf = makeNfemailTaxInvoice();
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: nf });

      await sut.findByNumber(100);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/NotasFiscais`,
        {
          ...AUTH_CONFIG,
          params: { numero: 100 },
        },
      );
    });
  });

  describe('findByOrderCode', () => {
    it('should throw ExternalApiError when order code is empty', async() => {
      await expect(sut.findByOrderCode('   ')).rejects.toThrow('Código do pedido é obrigatório');
    });

    it('should query by pedido param', async() => {
      const nf = makeNfemailTaxInvoice();
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: nf });

      await sut.findByOrderCode('PED-123');

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/NotasFiscais`,
        {
          ...AUTH_CONFIG,
          params: { pedido: 'PED-123' },
        },
      );
    });
  });

  describe('findByDocument', () => {
    it('should return mapped nfs when found', async() => {
      const nf = makeNfemailTaxInvoice();
      httpService.axiosRef.get = jest.fn().mockResolvedValue({
        data: { ListaNotaFiscal: [nf] },
      });

      const result = await sut.findByDocument('98.765.432/0001-11');

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/NotasFiscais`,
        {
          ...AUTH_CONFIG,
          params: { cpfcnpj: '98765432000111' },
        },
      );
      expect(result).toHaveLength(1);
      expect(result[0].externalId).toBe(42);
    });
  });

  describe('findAll', () => {
    it('should throw ExternalApiError when limit is greater than 30', async() => {
      await expect(sut.findAll({ limit: 31 })).rejects.toThrow('Limite máximo de 30 registros por página');
    });

    it('should return paginated nfs', async() => {
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

      expect(result).toEqual({
        rows: [expect.objectContaining({ externalId: 42 })],
        page: 2,
        limit: 5,
        total: 12,
      });
    });
  });

  describe('cancel', () => {
    it('should throw ExternalApiError when reason is shorter than 15 characters', async() => {
      await expect(sut.cancel({
        externalId: 42,
        reason: 'curto',
      })).rejects.toThrow('Motivo do cancelamento deve ter no mínimo 15 caracteres');
    });

    it('should cancel nf with encoded reason', async() => {
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
  });

  describe('getDanfe', () => {
    it('should throw ExternalApiError when access key is invalid', async() => {
      await expect(sut.getDanfe('123')).rejects.toThrow('Chave de acesso deve conter 44 dígitos');
    });

    it('should return base64 pdf content', async() => {
      const pdfBytes = Uint8Array.from(Buffer.from('fake-pdf'));
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: pdfBytes.buffer });

      const result = await sut.getDanfe(ACCESS_KEY);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/DANFe`,
        {
          ...AUTH_CONFIG,
          params: { chave: ACCESS_KEY },
          responseType: 'arraybuffer',
        },
      );
      expect(result.mimeType).toBe('application/pdf');
      expect(result.content).toBe(Buffer.from('fake-pdf').toString('base64'));
    });
  });

  describe('getXml', () => {
    it('should return xml content', async() => {
      const xml = '<NFe><infNFe Id="fake"/></NFe>';
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: xml });

      const result = await sut.getXml(ACCESS_KEY);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${API_URL}/api/ArquivoXML`,
        {
          ...AUTH_CONFIG,
          params: { chave: ACCESS_KEY },
        },
      );
      expect(result).toEqual({
        content: xml,
        mimeType: 'application/xml',
        fileName: `NotaFiscal-${ACCESS_KEY}.xml`,
      });
    });
  });

  describe('issueCorrectionLetter', () => {
    it('should throw ExternalApiError when reason is too short', async() => {
      await expect(sut.issueCorrectionLetter({
        accessKey: ACCESS_KEY,
        sequence: 1,
        reason: 'curto',
      })).rejects.toThrow('Motivo da carta de correção deve ter no mínimo 15 caracteres');
    });

    it('should post correction letter with query params', async() => {
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: {} });
      const reason = 'Correcao de endereco do destinatario';

      await sut.issueCorrectionLetter({
        accessKey: ACCESS_KEY,
        sequence: 1,
        reason,
      });

      expect(httpService.axiosRef.post).toHaveBeenCalledWith(
        `${API_URL}/api/NFeCorrigidas`,
        null,
        {
          ...AUTH_CONFIG,
          params: {
            chave: ACCESS_KEY,
            sequencia: 1,
            motivo: reason,
          },
        },
      );
    });
  });

  describe('getCorrectionLetterXml', () => {
    it('should return correction letter xml', async() => {
      const xml = '<CCe><infEvento Id="fake"/></CCe>';
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: xml });

      const result = await sut.getCorrectionLetterXml(ACCESS_KEY);

      expect(result.content).toBe(xml);
      expect(result.mimeType).toBe('application/xml');
    });
  });

  describe('invalidateNumbers', () => {
    it('should throw ExternalApiError when reason is too short', async() => {
      await expect(sut.invalidateNumbers({
        environment: NfEnvironment.PRODUCTION,
        year: 2026,
        series: 1,
        startNumber: 1,
        endNumber: 10,
        reason: 'curto',
      })).rejects.toThrow('Motivo da inutilização deve ter no mínimo 15 caracteres');
    });

    it('should return mapped invalidation result', async() => {
      const response = createMock<NfemailInvalidationResultDto>({
        cod_retorno: 0,
        dsc_retorno: 'retorno ok',
      });
      httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: response });
      const reason = 'Inutilizacao por erro de sequencia';

      const result = await sut.invalidateNumbers({
        environment: NfEnvironment.PRODUCTION,
        year: 2026,
        series: 1,
        startNumber: 1,
        endNumber: 10,
        reason,
      });

      expect(httpService.axiosRef.post).toHaveBeenCalledWith(
        `${API_URL}/api/Inutilizadas`,
        null,
        {
          ...AUTH_CONFIG,
          params: {
            ambiente: NfEnvironment.PRODUCTION,
            ano: 2026,
            serie: 1,
            numInicial: 1,
            numFinal: 10,
            motivo: reason,
          },
        },
      );
      expect(result).toEqual({
        code: 0,
        description: 'retorno ok',
      });
    });
  });

  describe('findAllInvalidations', () => {
    it('should throw ExternalApiError when limit is greater than 30', async() => {
      await expect(sut.findAllInvalidations({ year: 2026, limit: 31 })).rejects.toThrow('Limite máximo de 30 registros por página');
    });

    it('should return paginated invalidations', async() => {
      const response = createMock<NfemailFindAllInvalidationsResponseDto>({
        ListaInutilizadas: [{
          cod_ambiente: 1,
          num_ano: 2026,
          num_serie: 1,
          num_inicial: 1,
          num_final: 10,
          dsc_motivo: 'Inutilizacao teste',
        }],
        Paginacao: {
          page: 1,
          limit: 10,
          records: 1,
        },
      });
      httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: response });

      const result = await sut.findAllInvalidations({ year: 2026, page: 1, limit: 10 });

      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
