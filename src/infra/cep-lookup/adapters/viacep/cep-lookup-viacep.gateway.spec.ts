import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CepLookupOutputDto } from '../../dtos/cep-lookup.dto';
import { CepLookupViacepAdapterGateway } from './cep-lookup-viacep.gateway';
import { ViacepOutputDto } from './dtos/viacep.dto';

describe('CepLookupViacepAdapterGateway', () => {
  let sut: CepLookupViacepAdapterGateway;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<ILoggerGateway>;

  const CEP = '01001000';
  const API_URL = 'https://viacep.com.br/ws';

  beforeEach(async() => {
    const mockHttpService = {
      axiosRef: {
        get: jest.fn(),
      },
    };

    const mockConfigService = {
      viacepApiUrl: API_URL,
    };

    const mockLogger = {
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CepLookupViacepAdapterGateway,
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

    sut = module.get<CepLookupViacepAdapterGateway>(CepLookupViacepAdapterGateway);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    logger = module.get(TOKENS.LoggerGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lookup', () => {
    describe('invalid CEP format', () => {
      it('should throw ExternalApiError when CEP has less than 8 digits', async() => {
        await expect(sut.lookup('1234567')).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup('1234567')).rejects.toThrow('CEP inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw ExternalApiError when CEP has more than 8 digits', async() => {
        await expect(sut.lookup('123456789')).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup('123456789')).rejects.toThrow('CEP inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw ExternalApiError when CEP has letters and fewer than 8 digits after normalization', async() => {
        await expect(sut.lookup('12345ABC')).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup('12345ABC')).rejects.toThrow('CEP inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw ExternalApiError when CEP is empty after normalization', async() => {
        await expect(sut.lookup('abc')).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup('abc')).rejects.toThrow('CEP inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });
    });

    describe('success scenarios', () => {
      it('should return address when API returns valid data', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '01001-000',
          logradouro: 'Praça da Sé',
          complemento: 'lado ímpar',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        const result = await sut.lookup(CEP);

        expect(result).toEqual<CepLookupOutputDto>({
          zipCode: '01001-000',
          street: 'Praça da Sé',
          complement: 'lado ímpar',
          neighborhood: 'Sé',
          city: 'São Paulo',
          state: 'SP',
        });
        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${API_URL}/${CEP}/json/`);
      });

      it('should return null complement when complemento is empty', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '01001-000',
          logradouro: 'Praça da Sé',
          complemento: '',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        const result = await sut.lookup(CEP);

        expect(result.complement).toBeNull();
      });

      it('should return null complement when complemento is whitespace only', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '01001-000',
          logradouro: 'Praça da Sé',
          complemento: '   ',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        const result = await sut.lookup(CEP);

        expect(result.complement).toBeNull();
      });

      it('should normalize CEP with dashes before request', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '01001-000',
          logradouro: 'Praça da Sé',
          complemento: '',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await sut.lookup('01001-000');

        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${API_URL}/01001000/json/`);
      });

      it('should use empty string for missing optional fields', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '01001-000',
          logradouro: undefined,
          complemento: undefined,
          bairro: undefined,
          localidade: undefined,
          uf: undefined,
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        const result = await sut.lookup(CEP);

        expect(result).toEqual<CepLookupOutputDto>({
          zipCode: '01001-000',
          street: '',
          complement: null,
          neighborhood: '',
          city: '',
          state: '',
        });
      });
    });

    describe('when CEP not found', () => {
      it('should throw ExternalApiError when API returns erro: true', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '99999-999',
          erro: true,
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup('99999999')).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup('99999999')).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: '99999999',
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError when cep field is missing', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: undefined,
          logradouro: 'Street',
          bairro: 'Bairro',
          localidade: 'City',
          uf: 'SP',
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError when cep field is empty string', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '',
          logradouro: 'Street',
          bairro: 'Bairro',
          localidade: 'City',
          uf: 'SP',
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });
    });

    describe('when API returns different format', () => {
      it('should throw ExternalApiError and log when data is missing', async() => {
        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: undefined });

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when API returns different nested structure', async() => {
        const mockResponse = {
          data: {
            endereco: {
              codigoPostal: '01001-000',
              rua: 'Praça da Sé',
              bairro: 'Sé',
              cidade: 'São Paulo',
              estado: 'SP',
            },
          },
        };

        httpService.axiosRef.get = jest.fn().mockResolvedValue(mockResponse);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when API returns array instead of object', async() => {
        const mockResponse = {
          data: [
            {
              cep: '01001-000',
              logradouro: 'Praça da Sé',
              bairro: 'Sé',
              localidade: 'São Paulo',
              uf: 'SP',
            },
          ],
        };

        httpService.axiosRef.get = jest.fn().mockResolvedValue(mockResponse);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when API returns string instead of object', async() => {
        const mockResponse = {
          data: 'invalid response',
        };

        httpService.axiosRef.get = jest.fn().mockResolvedValue(mockResponse);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when API returns null', async() => {
        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: null });

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });
    });

    describe('network/HTTP error scenarios', () => {
      it('should throw ExternalApiError and log when HTTP request fails', async() => {
        const networkError = new Error('Network Error');
        httpService.axiosRef.get = jest.fn().mockRejectedValue(networkError);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('Network Error');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: networkError,
        });
      });

      it('should throw ExternalApiError and log when API returns 400', async() => {
        const axiosError = {
          response: { status: 400 },
          message: 'Request failed with status code 400',
        };
        httpService.axiosRef.get = jest.fn().mockRejectedValue(axiosError);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('Request failed with status code 400');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: axiosError,
        });
      });

      it('should throw ExternalApiError and log when API returns 404', async() => {
        const axiosError = {
          response: { status: 404 },
          message: 'Request failed with status code 404',
        };
        httpService.axiosRef.get = jest.fn().mockRejectedValue(axiosError);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('Request failed with status code 404');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: axiosError,
        });
      });

      it('should throw ExternalApiError and log when API returns 500', async() => {
        const axiosError = {
          response: { status: 500 },
          message: 'Request failed with status code 500',
        };
        httpService.axiosRef.get = jest.fn().mockRejectedValue(axiosError);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('Request failed with status code 500');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: axiosError,
        });
      });

      it('should throw ExternalApiError and log when timeout occurs', async() => {
        const timeoutError = new Error('timeout of 5000ms exceeded');
        httpService.axiosRef.get = jest.fn().mockRejectedValue(timeoutError);

        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('timeout of 5000ms exceeded');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: timeoutError,
        });
      });
    });

    describe('integration with dependencies', () => {
      it('should use ConfigService URL in request', async() => {
        const customUrl = 'https://custom-api.example.com/ws';
        (configService as any).viacepApiUrl = customUrl;

        const mockResponse = createMock<ViacepOutputDto>({
          cep: '01001-000',
          logradouro: 'Street',
          complemento: '',
          bairro: 'Neighborhood',
          localidade: 'City',
          uf: 'SP',
        });
        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await sut.lookup(CEP);

        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${customUrl}/${CEP}/json/`);
      });

      it('should pass normalized CEP in URL', async() => {
        const mockResponse = createMock<ViacepOutputDto>({
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: '',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
        });
        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await sut.lookup('01310-100');

        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${API_URL}/01310100/json/`);
      });
    });
  });
});
