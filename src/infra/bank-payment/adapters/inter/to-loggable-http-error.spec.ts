import { AxiosError } from 'axios';
import { toLoggableHttpError } from './to-loggable-http-error';

function makeAxiosErrorWithSecrets(): AxiosError {
  const error = new AxiosError('Request failed with status code 400');
  error.code = 'ERR_BAD_REQUEST';
  error.config = {
    method: 'post',
    url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas/req-123/cancelar',
    data: '{"motivoCancelamento":"ACERTOS"}',
    headers: {
      Authorization: 'Bearer secret-access-token',
      Accept: 'application/json',
    },
    httpsAgent: {
      cert: '-----BEGIN CERTIFICATE-----\nfake-cert\n-----END CERTIFICATE-----',
      key: '-----BEGIN PRIVATE KEY-----\nfake-key\n-----END PRIVATE KEY-----',
    },
  } as never;
  error.response = {
    status: 400,
    data: { message: 'motivoCancelamento inválido' },
    statusText: 'Bad Request',
    headers: {},
    config: error.config,
  };
  return error;
}

describe('toLoggableHttpError - Unit tests', () => {
  it('should be defined', () => {
    expect(toLoggableHttpError).toBeDefined();
  });

  it('should keep only relevant axios fields and drop certs, keys and authorization', () => {
    // Arrange
    const error = makeAxiosErrorWithSecrets();

    // Act
    const logged = toLoggableHttpError(error);
    const serialized = JSON.stringify(logged);

    // Assert
    expect(logged).toEqual({
      name: 'AxiosError',
      message: 'Request failed with status code 400',
      code: 'ERR_BAD_REQUEST',
      status: 400,
      method: 'post',
      url: 'https://cdpj-sandbox.partners.uatinter.co/cobranca/v3/cobrancas/req-123/cancelar',
      response: { message: 'motivoCancelamento inválido' },
    });
    expect(serialized).not.toContain('BEGIN CERTIFICATE');
    expect(serialized).not.toContain('BEGIN PRIVATE KEY');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('secret-access-token');
    expect(serialized).not.toContain('httpsAgent');
    expect(serialized).not.toContain('ACERTOS');
  });

  it('should map generic Error to name and message', () => {
    // Act
    const logged = toLoggableHttpError(new Error('network down'));

    // Assert
    expect(logged).toEqual({
      name: 'Error',
      message: 'network down',
    });
  });

  it('should map AxiosError without response to name, message and code', () => {
    // Arrange
    const error = new AxiosError('Network Error');
    error.code = 'ERR_NETWORK';

    // Act
    const logged = toLoggableHttpError(error);

    // Assert
    expect(logged).toEqual({
      name: 'AxiosError',
      message: 'Network Error',
      code: 'ERR_NETWORK',
      status: undefined,
      method: undefined,
      url: undefined,
      response: undefined,
    });
  });

  it('should stringify unknown values', () => {
    // Act
    const logged = toLoggableHttpError('boom');

    // Assert
    expect(logged).toEqual({
      name: 'UnknownError',
      message: 'boom',
    });
  });
});
