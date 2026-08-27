/* eslint-disable camelcase */
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
import { InterOauthConfigError } from './errors/inter-oauth-config.error';
import { InterOauthClient } from './inter-oauth.client';

describe('InterOauthClient - Unit tests', () => {
  let sut: InterOauthClient;
  let httpService: { axiosRef: { post: jest.Mock } };
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<ILoggerGateway>;
  let sutDir: string;
  let certPath: string;
  let keyPath: string;

  const SCOPE_A = 'boleto-cobranca.read boleto-cobranca.write';
  const SCOPE_A_REORDERED = 'boleto-cobranca.write boleto-cobranca.read';
  const TOKEN_RESPONSE = {
    access_token: 'access-token-abc',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: SCOPE_A,
  };

  beforeEach(async() => {
    sutDir = join(tmpdir(), `inter-oauth-client-${Date.now()}`);
    mkdirSync(sutDir, { recursive: true });
    certPath = join(sutDir, 'inter.crt');
    keyPath = join(sutDir, 'inter.key');
    writeFileSync(certPath, '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----\n');
    writeFileSync(keyPath, '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n');

    httpService = {
      axiosRef: {
        post: jest.fn().mockResolvedValue({ data: TOKEN_RESPONSE }),
      },
    };

    configService = createMock<ConfigService>({
      interApiUrl: 'https://cdpj-sandbox.partners.uatinter.co',
      interClientId: 'client-id',
      interClientSecret: 'client-secret',
      interCertPath: certPath,
      interKeyPath: keyPath,
    });

    logger = createMock<ILoggerGateway>({
      error: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterOauthClient,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
        { provide: TOKENS.LoggerGateway, useValue: logger },
      ],
    }).compile();

    sut = module.get(InterOauthClient);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    rmSync(sutDir, { recursive: true, force: true });
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should POST form-urlencoded with mTLS agent and map response to DTO', async() => {
    // Act
    const result = await sut.getAccessToken(SCOPE_A);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledTimes(1);
    const [url, body, options] = httpService.axiosRef.post.mock.calls[0];
    expect(url).toBe('https://cdpj-sandbox.partners.uatinter.co/oauth/v2/token');
    expect(body).toBe(
      'grant_type=client_credentials&client_id=client-id&client_secret=client-secret&scope=boleto-cobranca.read+boleto-cobranca.write',
    );
    expect(options.headers).toEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    });
    expect(options.httpsAgent).toBeDefined();
    expect(result).toEqual({
      accessToken: 'access-token-abc',
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: SCOPE_A,
    });
  });

  it('should not call HTTP on second request with same scope (cache hit)', async() => {
    // Act
    await sut.getAccessToken(SCOPE_A);
    await sut.getAccessToken(SCOPE_A);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledTimes(1);
  });

  it('should share cache for reordered scopes', async() => {
    // Act
    await sut.getAccessToken(SCOPE_A);
    await sut.getAccessToken(SCOPE_A_REORDERED);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledTimes(1);
  });

  it('should fetch again after expires_in minus 60s margin', async() => {
    // Arrange
    jest.useFakeTimers();
    httpService.axiosRef.post
      .mockResolvedValueOnce({ data: TOKEN_RESPONSE })
      .mockResolvedValueOnce({
        data: {
          ...TOKEN_RESPONSE,
          access_token: 'access-token-renewed',
        },
      });

    // Act
    const first = await sut.getAccessToken(SCOPE_A);
    jest.advanceTimersByTime((3600 - 60) * 1000 + 1);
    const second = await sut.getAccessToken(SCOPE_A);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledTimes(2);
    expect(first.accessToken).toBe('access-token-abc');
    expect(second.accessToken).toBe('access-token-renewed');
  });

  it('should coalesce parallel misses into a single POST', async() => {
    // Arrange
    let resolvePost: (value: unknown)=> void;
    httpService.axiosRef.post.mockImplementation(
      () => new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );

    // Act
    const p1 = sut.getAccessToken(SCOPE_A);
    const p2 = sut.getAccessToken(SCOPE_A);
    resolvePost!({ data: TOKEN_RESPONSE });
    const [r1, r2] = await Promise.all([p1, p2]);

    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledTimes(1);
    expect(r1.accessToken).toBe('access-token-abc');
    expect(r2.accessToken).toBe('access-token-abc');
  });

  it('should throw InterOauthConfigError when scope is empty', async() => {
    await expect(sut.getAccessToken('   ')).rejects.toBeInstanceOf(InterOauthConfigError);
    await expect(sut.getAccessToken('')).rejects.toThrow('Escopo OAuth do Banco Inter não pode ser vazio');
    expect(httpService.axiosRef.post).not.toHaveBeenCalled();
  });

  it('should throw InterOauthConfigError when client id is missing', async() => {
    // Arrange
    Object.defineProperty(configService, 'interClientId', { get: () => '' });

    // Act / Assert
    await expect(sut.getAccessToken(SCOPE_A)).rejects.toBeInstanceOf(InterOauthConfigError);
    await expect(sut.getAccessToken(SCOPE_A)).rejects.toThrow(
      'Variável de ambiente "INTER_CLIENT_ID" não está definida',
    );
    expect(httpService.axiosRef.post).not.toHaveBeenCalled();
  });

  it('should throw InterOauthConfigError when cert file is missing', async() => {
    // Arrange
    Object.defineProperty(configService, 'interCertPath', {
      get: () => join(sutDir, 'missing.crt'),
    });

    // Act / Assert
    await expect(sut.getAccessToken(SCOPE_A)).rejects.toBeInstanceOf(InterOauthConfigError);
    expect(httpService.axiosRef.post).not.toHaveBeenCalled();
  });

  it('should throw ExternalApiError and log without secrets on HTTP failure', async() => {
    // Arrange
    const networkError = new Error('network down');
    httpService.axiosRef.post.mockRejectedValue(networkError);

    // Act
    await expect(sut.getAccessToken(SCOPE_A)).rejects.toBeInstanceOf(ExternalApiError);
    await expect(sut.getAccessToken(SCOPE_A)).rejects.toThrow('Falha ao obter token OAuth no Banco Inter.');

    // Assert
    expect(logger.error).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, {
      adapter: 'inter',
      action: 'oauth-token',
      scope: 'boleto-cobranca.read boleto-cobranca.write',
      error: {
        name: 'Error',
        message: 'network down',
      },
    });
    const logged = (logger.error as jest.Mock).mock.calls[0][1];
    expect(JSON.stringify(logged)).not.toContain('client-secret');
    expect(JSON.stringify(logged)).not.toContain('access-token-abc');
  });

  it('should log axios failure without certs, private key or authorization', async() => {
    // Arrange
    const axiosError = new AxiosError('Request failed with status code 401');
    axiosError.code = 'ERR_BAD_REQUEST';
    axiosError.config = {
      method: 'post',
      url: 'https://cdpj-sandbox.partners.uatinter.co/oauth/v2/token',
      data: 'grant_type=client_credentials&client_id=client-id&client_secret=client-secret',
      headers: { Authorization: 'Bearer leaked-token' },
      httpsAgent: {
        cert: '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----',
        key: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
      },
    } as never;
    axiosError.response = {
      status: 401,
      data: { error: 'invalid_client' },
      statusText: 'Unauthorized',
      headers: {},
      config: axiosError.config,
    };
    httpService.axiosRef.post.mockRejectedValue(axiosError);

    // Act
    await expect(sut.getAccessToken(SCOPE_A)).rejects.toBeInstanceOf(ExternalApiError);

    // Assert
    const logged = (logger.error as jest.Mock).mock.calls[0][1];
    expect(logged.error).toEqual({
      name: 'AxiosError',
      message: 'Request failed with status code 401',
      code: 'ERR_BAD_REQUEST',
      status: 401,
      method: 'post',
      url: 'https://cdpj-sandbox.partners.uatinter.co/oauth/v2/token',
      response: { error: 'invalid_client' },
    });
    const serialized = JSON.stringify(logged);
    expect(serialized).not.toContain('BEGIN CERTIFICATE');
    expect(serialized).not.toContain('BEGIN PRIVATE KEY');
    expect(serialized).not.toContain('client-secret');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('leaked-token');
  });
});
