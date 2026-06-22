import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from 'src/core/config/config.service';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfIssueFormat } from '../../enums/nf-issue-format.enum';
import { makeValidIssueNfInput } from './testing/make-valid-issue-nf-input';
import { NfGenerationNfemailAdapterGateway } from './nf-generation-nfemail.gateway';

describe('NfGenerationNfemailAdapterGateway - Unit tests', () => {
  let sut: NfGenerationNfemailAdapterGateway;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<ILoggerGateway>;

  beforeEach(() => {
    httpService = createMock<HttpService>();
    configService = createMock<ConfigService>({
      nfemailApiUrl: 'https://api.nfemail.com.br',
      nfemailCnpj: '28695096000179',
      nfemailApiKey: 'api-key',
    });
    logger = createMock<ILoggerGateway>();

    httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: 42 });

    sut = new NfGenerationNfemailAdapterGateway(logger, configService, httpService);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should build sTXT payload with RT groups before posting', async() => {
    // Arrange
    const input = makeValidIssueNfInput({ format: NfIssueFormat.SEFAZ_TXT });

    // Act
    await sut.issue(input);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      'https://api.nfemail.com.br/api/NotasFiscais',
      expect.stringContaining('sTXT='),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    const body = (httpService.axiosRef.post as jest.Mock).mock.calls[0][1] as string;
    const decoded = decodeURIComponent(body.replace('sTXT=', ''));

    expect(decoded).toContain('UB12|000|000001||1.00|');
    expect(decoded).toContain('W60|1.00|');
    expect(decoded).toContain('N|\n');
    expect(decoded).toContain('I|1||teste|');
  });

  it('should build sXML payload with IBSCBS before posting', async() => {
    // Arrange
    const input = makeValidIssueNfInput({ format: NfIssueFormat.RPS_XML });

    // Act
    await sut.issue(input);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      'https://api.nfemail.com.br/api/ArquivoXML',
      expect.stringContaining('sXML='),
      expect.any(Object),
    );

    const body = (httpService.axiosRef.post as jest.Mock).mock.calls[0][1] as string;
    const decoded = decodeURIComponent(body.replace('sXML=', ''));

    expect(decoded).toContain('<IBSCBS>');
    expect(decoded).toContain('<IBSCBSTot>');
  });

  it('should log and throw ExternalApiError when issue fails', async() => {
    // Arrange
    const input = makeValidIssueNfInput();
    httpService.axiosRef.post = jest.fn().mockRejectedValue(new Error('falha'));

    // Act & Assert
    await expect(sut.issue(input)).rejects.toThrow('falha');
    expect(logger.error).toHaveBeenCalledWith(LogContext.NF_GENERATION, expect.objectContaining({
      action: 'issue',
    }));
  });

  it('should resolve externalId from pedido when NFeMail returns cod_processo 0', async() => {
    // Arrange
    const input = makeValidIssueNfInput();
    httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: 0 });
    httpService.axiosRef.get = jest.fn().mockResolvedValue({
      data: {
        ListaNotaFiscal: [{
          row_id: 1,
          cod_nfemail: 99,
          cod_processo: 0,
          num_cnpj: '28695096000179',
        }],
        Paginacao: { page: 1, limit: 1, records: 1 },
      },
    });

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(result.externalId).toBe(99);
    expect(httpService.axiosRef.get).toHaveBeenCalledWith(
      'https://api.nfemail.com.br/api/NotasFiscais',
      expect.objectContaining({
        params: expect.objectContaining({ pedido: 'PED-123' }),
      }),
    );
  });

  it('should throw ExternalApiError when NFeMail returns zero and pedido is not found', async() => {
    // Arrange
    const input = makeValidIssueNfInput();
    httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: 0 });
    httpService.axiosRef.get = jest.fn().mockResolvedValue({
      data: { ListaNotaFiscal: [], Paginacao: { page: 1, limit: 1, records: 0 } },
    });

    // Act & Assert
    await expect(sut.issue(input)).rejects.toThrow('NFeMail não retornou o código interno da nota fiscal');
  });
});
