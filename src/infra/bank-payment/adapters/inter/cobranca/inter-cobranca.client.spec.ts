import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError } from 'axios';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { BankPaymentPersonType } from '../../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../../enums/bank-payment-provider.enum';
import { BankPaymentNotFoundError } from '../../../errors/bank-payment-not-found.error';
import { BankPaymentRequestError } from '../../../errors/bank-payment-request.error';
import { InterOauthClient } from '../oauth/inter-oauth.client';
import { InterCobrancaClient } from './inter-cobranca.client';

function makeAxiosError(status: number, data?: unknown): AxiosError {
  const error = new AxiosError('request failed');
  error.response = {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  };
  return error;
}

describe('InterCobrancaClient - Unit tests', () => {
  let sut: InterCobrancaClient;
  let httpService: { axiosRef: { request: jest.Mock } };
  let oauthClient: jest.Mocked<InterOauthClient>;
  let logger: jest.Mocked<ILoggerGateway>;
  let sutDir: string;

  const issueInput = {
    provider: BankPaymentProvider.INTER,
    yourNumber: 'INV-1',
    amount: 10,
    dueDate: '2026-09-01',
    daysAfterDue: 30,
    payer: {
      document: '11122233344',
      personType: BankPaymentPersonType.INDIVIDUAL,
      name: 'João',
    },
  };

  beforeEach(async() => {
    sutDir = join(tmpdir(), `inter-cobranca-client-${Date.now()}`);
    mkdirSync(sutDir, { recursive: true });
    const certPath = join(sutDir, 'inter.crt');
    const keyPath = join(sutDir, 'inter.key');
    writeFileSync(certPath, '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----\n');
    writeFileSync(keyPath, '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n');

    httpService = {
      axiosRef: {
        request: jest.fn(),
      },
    };

    oauthClient = createMock<InterOauthClient>({
      getAccessToken: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: InterCobrancaClient.OAUTH_SCOPE,
      }),
    });

    logger = createMock<ILoggerGateway>({
      error: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterCobrancaClient,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: createMock<ConfigService>({
            interApiUrl: 'https://cdpj-sandbox.partners.uatinter.co',
            interCertPath: certPath,
            interKeyPath: keyPath,
          }),
        },
        { provide: InterOauthClient, useValue: oauthClient },
        { provide: TOKENS.LoggerGateway, useValue: logger },
      ],
    }).compile();

    sut = module.get(InterCobrancaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
    rmSync(sutDir, { recursive: true, force: true });
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should POST /cobranca/v3/cobrancas with Bearer and mTLS', async() => {
    // Arrange
    httpService.axiosRef.request.mockResolvedValue({
      data: { codigoSolicitacao: 'req-123' },
    });

    // Act
    const result = await sut.issue(issueInput);

    // Assert
    expect(oauthClient.getAccessToken).toHaveBeenCalledWith(InterCobrancaClient.OAUTH_SCOPE);
    expect(httpService.axiosRef.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas',
      headers: expect.objectContaining({
        Authorization: 'Bearer access-token',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      httpsAgent: expect.anything(),
      data: expect.objectContaining({
        seuNumero: 'INV-1',
        valorNominal: 10,
      }),
    }));
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    });
  });

  it('should GET /cobrancas/{codigoSolicitacao}', async() => {
    // Arrange
    httpService.axiosRef.request.mockResolvedValue({
      data: {
        cobranca: {
          codigoSolicitacao: 'req-123',
          seuNumero: 'INV-1',
          situacao: 'A_RECEBER',
          valorNominal: 10,
          dataVencimento: '2026-09-01',
          pagador: {
            cpfCnpj: '11122233344',
            tipoPessoa: 'FISICA',
            nome: 'João',
          },
        },
        boleto: {
          nossoNumero: '1',
          codigoBarras: 'bar',
          linhaDigitavel: 'line',
        },
        pix: {
          txid: 'tx',
          pixCopiaECola: 'pix-copy',
        },
      },
    });

    // Act
    const result = await sut.find({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    });

    // Assert
    expect(httpService.axiosRef.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas/req-123',
    }));
    expect(result.requestCode).toBe('req-123');
    expect(result.yourNumber).toBe('INV-1');
  });

  it('should GET /cobrancas/{codigoSolicitacao}/pdf with Bearer and mTLS', async() => {
    // Arrange
    httpService.axiosRef.request.mockResolvedValue({
      data: { pdf: 'JVBERi0xLjQK' },
    });

    // Act
    const result = await sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    });

    // Assert
    expect(oauthClient.getAccessToken).toHaveBeenCalledWith(InterCobrancaClient.OAUTH_SCOPE);
    expect(httpService.axiosRef.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas/req-123/pdf',
      headers: expect.objectContaining({
        Authorization: 'Bearer access-token',
        Accept: 'application/json',
      }),
      httpsAgent: expect.anything(),
    }));
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
      pdf: 'JVBERi0xLjQK',
    });
  });

  it('should throw ExternalApiError when pdf is missing from response', async() => {
    httpService.axiosRef.request.mockResolvedValue({ data: {} });

    await expect(sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    })).rejects.toBeInstanceOf(ExternalApiError);
    await expect(sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    })).rejects.toThrow('Falha ao obter PDF da cobrança no Banco Inter.');
  });

  it('should throw BankPaymentNotFoundError on 404 for getPdf', async() => {
    httpService.axiosRef.request.mockRejectedValue(makeAxiosError(404));

    await expect(sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'missing',
    })).rejects.toBeInstanceOf(BankPaymentNotFoundError);

    expect(logger.error).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      action: 'getPdf',
      requestCode: 'missing',
    }));
  });

  it('should POST cancelar with motivoCancelamento', async() => {
    // Arrange
    httpService.axiosRef.request.mockResolvedValue({ data: undefined });

    // Act
    await sut.cancel({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
      reason: 'Cliente pediu o cancelamento',
    });

    // Assert
    expect(httpService.axiosRef.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas/req-123/cancelar',
      headers: expect.objectContaining({
        Accept: 'application/problem+json',
        'Content-Type': 'application/json',
      }),
      data: { motivoCancelamento: 'Cliente pediu o cancelamento' },
    }));
  });

  it('should throw BankPaymentNotFoundError on 404', async() => {
    httpService.axiosRef.request.mockRejectedValue(makeAxiosError(404));

    await expect(sut.find({
      provider: BankPaymentProvider.INTER,
      requestCode: 'missing',
    })).rejects.toBeInstanceOf(BankPaymentNotFoundError);

    expect(logger.error).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      action: 'find',
      requestCode: 'missing',
    }));
  });

  it('should throw BankPaymentRequestError on 4xx', async() => {
    httpService.axiosRef.request.mockRejectedValue(
      makeAxiosError(422, { message: 'Dados inválidos' }),
    );

    await expect(sut.issue(issueInput)).rejects.toBeInstanceOf(BankPaymentRequestError);
    await expect(sut.issue(issueInput)).rejects.toThrow('Dados inválidos');
  });

  it('should throw ExternalApiError on network failure', async() => {
    httpService.axiosRef.request.mockRejectedValue(new Error('network down'));

    await expect(sut.issue(issueInput)).rejects.toBeInstanceOf(ExternalApiError);
  });

  it('should log axios failure without certs, private key or authorization', async() => {
    // Arrange
    const axiosError = new AxiosError('Request failed with status code 422');
    axiosError.code = 'ERR_BAD_REQUEST';
    axiosError.config = {
      method: 'post',
      url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas',
      data: '{"seuNumero":"INV-1"}',
      headers: { Authorization: 'Bearer leaked-token' },
      httpsAgent: {
        cert: '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----',
        key: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
      },
    } as never;
    axiosError.response = {
      status: 422,
      data: { message: 'Dados inválidos' },
      statusText: 'Unprocessable Entity',
      headers: {},
      config: axiosError.config,
    };
    httpService.axiosRef.request.mockRejectedValue(axiosError);

    // Act
    await expect(sut.issue(issueInput)).rejects.toBeInstanceOf(BankPaymentRequestError);

    // Assert
    const logged = (logger.error as jest.Mock).mock.calls[0][1];
    expect(logged.error).toEqual({
      name: 'AxiosError',
      message: 'Request failed with status code 422',
      code: 'ERR_BAD_REQUEST',
      status: 422,
      method: 'post',
      url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas',
      response: { message: 'Dados inválidos' },
    });
    const serialized = JSON.stringify(logged);
    expect(serialized).not.toContain('BEGIN CERTIFICATE');
    expect(serialized).not.toContain('BEGIN PRIVATE KEY');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('leaked-token');
    expect(serialized).not.toContain('httpsAgent');
  });
});
