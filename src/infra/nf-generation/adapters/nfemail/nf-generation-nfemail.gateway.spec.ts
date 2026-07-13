/* eslint-disable camelcase */
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from 'src/core/config/config.service';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfIssueFormat } from '../../enums/nf-issue-format.enum';
import { makeValidIssueNfInput } from './testing/make-valid-issue-nf-input';
import { makeValidIssueNfseInput } from './testing/make-valid-issue-nfse-input';
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
      expect.stringMatching(/^=/),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    const body = (httpService.axiosRef.post as jest.Mock).mock.calls[0][1] as string;
    const decoded = decodeURIComponent(body.slice(1));

    expect(decoded).toContain('UB12|000|000001||1.00|');
    expect(decoded).toContain('W60|1.00|');
    expect(decoded).toContain('N|\n');
    expect(decoded).toContain('I|1||teste|');
  });

  it('should build RPS XML payload before posting NFS-e', async() => {
    // Arrange
    const input = makeValidIssueNfseInput();

    // Act
    await sut.issue(input);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      'https://api.nfemail.com.br/api/ArquivoXML',
      expect.stringMatching(/^=/),
      expect.any(Object),
    );

    const body = (httpService.axiosRef.post as jest.Mock).mock.calls[0][1] as string;
    const decoded = decodeURIComponent(body.slice(1));

    expect(decoded).toContain('<Rps xmlns="http://www.abrasf.org.br/nfse.xsd">');
    expect(decoded).toContain('<ItemListaServico>01.04</ItemListaServico>');
    expect(decoded).not.toContain('<NFe');
  });

  it('should build NF-e XML payload with IBSCBS before posting', async() => {
    // Arrange
    const input = makeValidIssueNfInput({ format: NfIssueFormat.NFE_XML });

    // Act
    await sut.issue(input);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      'https://api.nfemail.com.br/api/ArquivoXML',
      expect.stringMatching(/^=/),
      expect.any(Object),
    );

    const body = (httpService.axiosRef.post as jest.Mock).mock.calls[0][1] as string;
    const decoded = decodeURIComponent(body.slice(1));

    expect(decoded).toContain('<IBSCBS>');
    expect(decoded).toContain('<IBSCBSTot>');
    expect(decoded).toContain('<NFe xmlns="http://www.portalfiscal.inf.br/nfe">');
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
          nfe_numero: 1,
          ped_numero: 'PED-123',
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

  it('should resolve NFS-e externalId by RPS key when post returns zero', async() => {
    // Arrange
    const input = makeValidIssueNfseInput();
    httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: 0 });
    httpService.axiosRef.get = jest
      .fn()
      .mockResolvedValueOnce({
        data: { ListaNotaFiscal: [], Paginacao: { page: 1, limit: 1, records: 0 } },
      })
      .mockResolvedValueOnce({
        data: {
          ListaNotaFiscal: [{
            row_id: 1,
            cod_nfemail: 77,
            cod_processo: -77,
            num_cnpj: '13709683000100',
            nfe_numero: 0,
            nfe_chave: 'RPS00000000000000100001',
          }],
          Paginacao: { page: 1, limit: 30, records: 1 },
        },
      });

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(result.externalId).toBe(77);
    expect(httpService.axiosRef.get).toHaveBeenNthCalledWith(
      2,
      'https://api.nfemail.com.br/api/NotasFiscais',
      expect.objectContaining({
        params: expect.objectContaining({ cpfcnpj: '13709683000100' }),
      }),
    );
  });

  it('should not treat existing NF-e as NFS-e when resolving by RPS number', async() => {
    // Arrange
    const input = makeValidIssueNfseInput();
    httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: 0 });
    httpService.axiosRef.get = jest
      .fn()
      .mockResolvedValue({
        data: {
          ListaNotaFiscal: [{
            row_id: 9,
            cod_nfemail: 99,
            cod_processo: 100,
            num_cnpj: '13709683000100',
            nfe_numero: 1,
            nfe_chave: '35260112345678000199550010000001001000000010',
          }],
          Paginacao: { page: 1, limit: 1, records: 1 },
        },
      });

    // Act & Assert
    await expect(sut.issue(input)).rejects.toThrow('NFeMail importou a nota, mas não retornou o código interno');
  });

  it('should throw ExternalApiError when post fails for NFS-e', async() => {
    // Arrange
    const input = makeValidIssueNfseInput();
    httpService.axiosRef.post = jest.fn().mockRejectedValue({
      message: 'Request failed with status code 400',
      response: { data: 'Erro de validação' },
    });

    // Act & Assert
    await expect(sut.issue(input)).rejects.toThrow('Erro de validação');
  });

  it('should throw ExternalApiError when NFeMail returns zero and note is not found', async() => {
    // Arrange
    const input = makeValidIssueNfInput();
    httpService.axiosRef.post = jest.fn().mockResolvedValue({ data: 0 });
    httpService.axiosRef.get = jest.fn().mockResolvedValue({
      data: { ListaNotaFiscal: [], Paginacao: { page: 1, limit: 1, records: 0 } },
    });

    // Act & Assert
    await expect(sut.issue(input)).rejects.toThrow('NFeMail importou a nota, mas não retornou o código interno');
  });
});
