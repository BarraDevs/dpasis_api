import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { InvalidCnpjError } from 'src/shared/value-objects/cnpj/cnpj.error';
import { CnpjLookupCnpjaAdapterGateway } from './cnpj-lookup-cnpja.gateway';
import { CnpjaOutputDto } from './dtos/cnpja.dto';

describe('CnpjLookupCnpjaAdapterGateway', () => {
  let sut: CnpjLookupCnpjaAdapterGateway;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<ILoggerGateway>;

  const VALID_CNPJ = '09.748.165/0001-10';
  const VALID_CNPJ_NORMALIZED = '09748165000110';
  const API_URL = 'https://api.cnpja.com/companies';

  beforeEach(async() => {
    const mockHttpService = {
      axiosRef: {
        get: jest.fn(),
      },
    };

    const mockConfigService = {
      cnpjaApiUrl: API_URL,
    };

    const mockLogger = {
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnpjLookupCnpjaAdapterGateway,
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

    sut = module.get<CnpjLookupCnpjaAdapterGateway>(CnpjLookupCnpjaAdapterGateway);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    logger = module.get(TOKENS.LoggerGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lookup', () => {
    describe('invalid CNPJ format (value-object validation)', () => {
      it('should throw InvalidCnpjError when CNPJ is empty', async() => {
        await expect(sut.lookup('')).rejects.toThrow(InvalidCnpjError);
        await expect(sut.lookup('')).rejects.toThrow('CNPJ inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw InvalidCnpjError when CNPJ has wrong length', async() => {
        await expect(sut.lookup('1234567890123')).rejects.toThrow(InvalidCnpjError);
        await expect(sut.lookup('1234567890123')).rejects.toThrow('CNPJ inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw InvalidCnpjError when CNPJ has invalid check digits', async() => {
        await expect(sut.lookup('09.748.165/0001-11')).rejects.toThrow(InvalidCnpjError);
        await expect(sut.lookup('09.748.165/0001-11')).rejects.toThrow('CNPJ inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw InvalidCnpjError when CNPJ has all digits equal', async() => {
        await expect(sut.lookup('11.111.111/1111-11')).rejects.toThrow(InvalidCnpjError);
        await expect(sut.lookup('11.111.111/1111-11')).rejects.toThrow('CNPJ inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw InvalidCnpjError when CNPJ contains letters', async() => {
        await expect(sut.lookup('invalid-cnpj')).rejects.toThrow(InvalidCnpjError);
        await expect(sut.lookup('invalid-cnpj')).rejects.toThrow('CNPJ inválido');

        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });
    });

    describe('success scenarios', () => {
      it('should return fantasyName and companyName when API returns valid data', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Empresa Fantasia',
          company: { name: 'Empresa Razão Social LTDA' },
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        const result = await sut.lookup(VALID_CNPJ);

        expect(result).toEqual({
          fantasyName: 'Empresa Fantasia',
          companyName: 'Empresa Razão Social LTDA',
        });
        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${API_URL}/${VALID_CNPJ_NORMALIZED}`);
      });

      it('should return empty fantasyName when alias is null', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: null,
          company: { name: 'Empresa Razão Social LTDA' },
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        const result = await sut.lookup(VALID_CNPJ);

        expect(result).toEqual({
          fantasyName: '',
          companyName: 'Empresa Razão Social LTDA',
        });
      });

      it('should return empty fantasyName when alias is undefined', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: undefined,
          company: { name: 'Empresa Razão Social LTDA' },
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        const result = await sut.lookup(VALID_CNPJ);

        expect(result).toEqual({
          fantasyName: '',
          companyName: 'Empresa Razão Social LTDA',
        });
      });

      it('should use normalized CNPJ in API request', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Fantasia',
          company: { name: 'Razão Social' },
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await sut.lookup('27.190.423/0001-78');

        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${API_URL}/27190423000178`);
      });
    });

    describe('when CNPJ not found', () => {
      it('should throw ExternalApiError when company.name is empty', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Fantasia',
          company: { name: '' },
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError when company.name is null', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Fantasia',
          company: { name: null as unknown as string },
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError when company.name is undefined', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Fantasia',
          company: { name: undefined },
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });
    });

    describe('when API returns different format', () => {
      it('should throw ExternalApiError and log when company is missing', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Fantasia',
          company: undefined,
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when data is missing', async() => {
        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: undefined });

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when company is null', async() => {
        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Fantasia',
          company: null as any,
        });

        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when API returns different nested structure', async() => {
        const mockResponse = {
          data: {
            empresa: {
              razaoSocial: 'Outra Estrutura',
              nomeFantasia: 'Fantasia',
            },
          },
        };

        httpService.axiosRef.get = jest.fn().mockResolvedValue(mockResponse);

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when API returns array instead of object', async() => {
        const mockResponse = {
          data: [
            { alias: 'Fantasia', company: { name: 'Razão' } },
          ],
        };

        httpService.axiosRef.get = jest.fn().mockResolvedValue(mockResponse);

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError and log when API returns string instead of object', async() => {
        const mockResponse = {
          data: 'invalid response',
        };

        httpService.axiosRef.get = jest.fn().mockResolvedValue(mockResponse);

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('CNPJ não encontrado');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: expect.any(ExternalApiError),
        });
      });
    });

    describe('network/HTTP error scenarios', () => {
      it('should throw ExternalApiError and log when HTTP request fails', async() => {
        const networkError = new Error('Network Error');
        httpService.axiosRef.get = jest.fn().mockRejectedValue(networkError);

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('Network Error');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: networkError,
        });
      });

      it('should throw ExternalApiError and log when API returns 404', async() => {
        const axiosError = {
          response: { status: 404 },
          message: 'Request failed with status code 404',
        };
        httpService.axiosRef.get = jest.fn().mockRejectedValue(axiosError);

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('Request failed with status code 404');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: axiosError,
        });
      });

      it('should throw ExternalApiError and log when API returns 500', async() => {
        const axiosError = {
          response: { status: 500 },
          message: 'Request failed with status code 500',
        };
        httpService.axiosRef.get = jest.fn().mockRejectedValue(axiosError);

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('Request failed with status code 500');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: axiosError,
        });
      });

      it('should throw ExternalApiError and log when timeout occurs', async() => {
        const timeoutError = new Error('timeout of 5000ms exceeded');
        httpService.axiosRef.get = jest.fn().mockRejectedValue(timeoutError);

        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(VALID_CNPJ)).rejects.toThrow('timeout of 5000ms exceeded');

        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: VALID_CNPJ,
          error: timeoutError,
        });
      });
    });

    describe('integration with dependencies', () => {
      it('should use ConfigService URL in request', async() => {
        const customUrl = 'https://custom-api.example.com/companies';
        (configService as any).cnpjaApiUrl = customUrl;

        const mockResponse = createMock<CnpjaOutputDto>({
          alias: 'Fantasia',
          company: { name: 'Razão Social' },
        });
        httpService.axiosRef.get = jest.fn().mockResolvedValue({ data: mockResponse });

        await sut.lookup(VALID_CNPJ);

        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${customUrl}/${VALID_CNPJ_NORMALIZED}`);
      });
    });
  });
});
