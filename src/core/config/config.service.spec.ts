import { ConfigService as NestConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { Environment } from './environment.enum';

describe('ConfigService', () => {
  let sut: ConfigService;
  let nestConfigService: jest.Mocked<NestConfigService>;

  beforeEach(async() => {
    const mockNestConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: NestConfigService,
          useValue: mockNestConfigService,
        },
      ],
    }).compile();

    sut = module.get<ConfigService>(ConfigService);
    nestConfigService = module.get<jest.Mocked<NestConfigService>>(NestConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each(
    [
      ...Object.values(Environment),
    ]
  )('environment properties', (value: string) => {
    it(`should return the NODE_ENV value (${value})`, () => {
      nestConfigService.get.mockReturnValue(value);

      const result = sut.nodeEnv;

      expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(result).toBe(value);
    });

    it(`should return true for NODE_ENV value (${value})`, () => {
      nestConfigService.get.mockReturnValue(value);

      expect(sut.isDevelopment).toBe(value === Environment.Development);
      expect(sut.isProduction).toBe(value === Environment.Production);
      expect(sut.isTest).toBe(value === Environment.Test);
    });
  });

  describe('server properties', () => {
    describe('port', () => {
      it('should return the PORT value as number', () => {
        const mockPort = 3000;
        nestConfigService.get.mockReturnValue(mockPort);

        const result = sut.port;

        expect(nestConfigService.get).toHaveBeenCalledWith('PORT');
        expect(result).toBe(mockPort);
      });
    });

    describe('sslKeyPath', () => {
      it('should return the SSL_KEY value', () => {
        const mockPath = '/path/to/ssl.key';
        nestConfigService.get.mockReturnValue(mockPath);

        const result = sut.sslKeyPath;

        expect(nestConfigService.get).toHaveBeenCalledWith('SSL_KEY');
        expect(result).toBe(mockPath);
      });
    });

    describe('sslCertPath', () => {
      it('should return the SSL_CERT value', () => {
        const mockPath = '/path/to/ssl.cert';
        nestConfigService.get.mockReturnValue(mockPath);

        const result = sut.sslCertPath;

        expect(nestConfigService.get).toHaveBeenCalledWith('SSL_CERT');
        expect(result).toBe(mockPath);
      });
    });

    describe('sslCaPath', () => {
      it('should return the SSL_CA value', () => {
        const mockPath = '/path/to/ssl.ca';
        nestConfigService.get.mockReturnValue(mockPath);

        const result = sut.sslCaPath;

        expect(nestConfigService.get).toHaveBeenCalledWith('SSL_CA');
        expect(result).toBe(mockPath);
      });
    });
  });

  describe('cors properties', () => {
    describe('corsOrigin', () => {
      it('should return the CORS_ORIGIN value', () => {
        const mockOrigin = 'http://localhost:3000';
        nestConfigService.get.mockReturnValue(mockOrigin);

        const result = sut.corsOrigin;

        expect(nestConfigService.get).toHaveBeenCalledWith('CORS_ORIGIN');
        expect(result).toBe(mockOrigin);
      });
    });
  });

  describe('jwt properties', () => {
    describe('jwtSecret', () => {
      it('should return the JWT_SECRET value', () => {
        const mockSecret = 'super-secret-jwt-key';
        nestConfigService.get.mockReturnValue(mockSecret);

        const result = sut.jwtSecret;

        expect(nestConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
        expect(result).toBe(mockSecret);
      });
    });
  });

  describe('database properties', () => {
    describe('databaseUrl', () => {
      it('should return the DATABASE_URL value', () => {
        const mockUrl = 'postgresql://user:pass@localhost:5432/db';
        nestConfigService.get.mockReturnValue(mockUrl);

        const result = sut.databaseUrl;

        expect(nestConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
        expect(result).toBe(mockUrl);
      });
    });
  });

  describe('aws properties', () => {
    describe('awsAccessKeyId', () => {
      it('should return the AWS_ACCESS_KEY_ID value', () => {
        const mockKeyId = 'AKIAIOSFODNN7EXAMPLE';
        nestConfigService.get.mockReturnValue(mockKeyId);

        const result = sut.awsAccessKeyId;

        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
        expect(result).toBe(mockKeyId);
      });
    });

    describe('awsSecretAccessKey', () => {
      it('should return the AWS_SECRET_ACCESS_KEY value', () => {
        const mockSecret = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
        nestConfigService.get.mockReturnValue(mockSecret);

        const result = sut.awsSecretAccessKey;

        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_SECRET_ACCESS_KEY');
        expect(result).toBe(mockSecret);
      });
    });

    describe('awsRegion', () => {
      it('should return the AWS_REGION value', () => {
        const mockRegion = 'us-east-1';
        nestConfigService.get.mockReturnValue(mockRegion);

        const result = sut.awsRegion;

        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_REGION');
        expect(result).toBe(mockRegion);
      });
    });

    describe('awsBucketName', () => {
      it('should return the AWS_BUCKET_NAME value', () => {
        const mockBucket = 'my-s3-bucket';
        nestConfigService.get.mockReturnValue(mockBucket);

        const result = sut.awsBucketName;

        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_BUCKET_NAME');
        expect(result).toBe(mockBucket);
      });
    });
  });

  describe('smtp properties', () => {
    describe('smtpHost', () => {
      it('should return the SMTP_HOST value', () => {
        const mockHost = 'smtp.gmail.com';
        nestConfigService.get.mockReturnValue(mockHost);

        const result = sut.smtpHost;

        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_HOST');
        expect(result).toBe(mockHost);
      });
    });

    describe('smtpPort', () => {
      it('should return the SMTP_PORT value as number', () => {
        const mockPort = 587;
        nestConfigService.get.mockReturnValue(mockPort);

        const result = sut.smtpPort;

        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_PORT');
        expect(result).toBe(mockPort);
      });
    });

    describe('smtpTo', () => {
      it('should return the SMTP_TO value', () => {
        const mockTo = 'recipient@example.com';
        nestConfigService.get.mockReturnValue(mockTo);

        const result = sut.smtpTo;

        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_TO');
        expect(result).toBe(mockTo);
      });
    });

    describe('smtpFrom', () => {
      it('should return the SMTP_FROM value', () => {
        const mockFrom = 'sender@example.com';
        nestConfigService.get.mockReturnValue(mockFrom);

        const result = sut.smtpFrom;

        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_FROM');
        expect(result).toBe(mockFrom);
      });
    });

    describe('smtpUsername', () => {
      it('should return the SMTP_USERNAME value', () => {
        const mockUsername = 'smtp-user';
        nestConfigService.get.mockReturnValue(mockUsername);

        const result = sut.smtpUsername;

        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_USERNAME');
        expect(result).toBe(mockUsername);
      });
    });

    describe('smtpPassword', () => {
      it('should return the SMTP_PASSWORD value', () => {
        const mockPassword = 'smtp-password';
        nestConfigService.get.mockReturnValue(mockPassword);

        const result = sut.smtpPassword;

        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_PASSWORD');
        expect(result).toBe(mockPassword);
      });
    });
  });

  describe('redis properties', () => {
    describe('redisUrl', () => {
      it('should return the REDIS_URL value', () => {
        const mockUrl = 'redis_teste://localhost:6379';
        nestConfigService.get.mockReturnValue(mockUrl);

        const result = sut.redisUrl;

        expect(nestConfigService.get).toHaveBeenCalledWith('REDIS_URL');
        expect(result).toBe(mockUrl);
      });
    });

    describe('redisCacheDatabase', () => {
      it('should return the REDIS_CACHE_DATABASE value as number', () => {
        const mockDatabase = 0;
        nestConfigService.get.mockReturnValue(mockDatabase);

        const result = sut.redisCacheDatabase;

        expect(result).toBe(mockDatabase);
      });
    });

    describe('redisQueueDatabase', () => {
      it('should return the REDIS_QUEUE_DATABASE value as number', () => {
        const mockDatabase = 1;
        nestConfigService.get.mockReturnValue(mockDatabase);

        const result = sut.redisQueueDatabase;

        expect(result).toBe(mockDatabase);
      });
    });

    describe('cnpjaApiUrl', () => {
      it('should return the CNPJA_API_URL value', () => {
        const mockUrl = 'https://open.cnpja.com/office';
        nestConfigService.get.mockReturnValue(mockUrl);

        const result = sut.cnpjaApiUrl;

        expect(nestConfigService.get).toHaveBeenCalledWith('CNPJA_API_URL');
        expect(result).toBe(mockUrl);
      });
    });

    describe('viacepApiUrl', () => {
      it('should return the VIACEP_API_URL value', () => {
        const mockUrl = 'https://viacep.com.br/ws/01001000/json/';
        nestConfigService.get.mockReturnValue(mockUrl);

        const result = sut.viacepApiUrl;

        expect(nestConfigService.get).toHaveBeenCalledWith('VIACEP_API_URL');
        expect(result).toBe(mockUrl);
      });
    });

    describe('nfemailApiUrl', () => {
      it('should return the NFEMAIL_API_URL value', () => {
        const mockUrl = 'https://api.nfemail.com.br';
        nestConfigService.get.mockReturnValue(mockUrl);

        const result = sut.nfemailApiUrl;

        expect(nestConfigService.get).toHaveBeenCalledWith('NFEMAIL_API_URL');
        expect(result).toBe(mockUrl);
      });
    });

    describe('nfemailCnpj', () => {
      it('should return the NFEMAIL_CNPJ value', () => {
        const mockCnpj = '12345678000199';
        nestConfigService.get.mockReturnValue(mockCnpj);

        const result = sut.nfemailCnpj;

        expect(nestConfigService.get).toHaveBeenCalledWith('NFEMAIL_CNPJ');
        expect(result).toBe(mockCnpj);
      });
    });

    describe('nfemailApiKey', () => {
      it('should return the NFEMAIL_API_KEY value', () => {
        const mockApiKey = 'secret-key';
        nestConfigService.get.mockReturnValue(mockApiKey);

        const result = sut.nfemailApiKey;

        expect(nestConfigService.get).toHaveBeenCalledWith('NFEMAIL_API_KEY');
        expect(result).toBe(mockApiKey);
      });
    });

    describe('gissProviderEnabled', () => {
      it('should return the GISS_PROVIDER_ENABLED value as boolean', () => {
        nestConfigService.get.mockReturnValue(true);

        const result = sut.gissProviderEnabled;

        expect(nestConfigService.get).toHaveBeenCalledWith('GISS_PROVIDER_ENABLED');
        expect(result).toBe(true);
      });

      it('should return false when GISS_PROVIDER_ENABLED is undefined', () => {
        nestConfigService.get.mockReturnValue(undefined);

        const result = sut.gissProviderEnabled;

        expect(result).toBe(false);
      });
    });

    describe('gissCertPath', () => {
      it('should return the GISS_CERT_PATH value', () => {
        const mockPath = '/certs/giss.pfx';
        nestConfigService.get.mockReturnValue(mockPath);

        const result = sut.gissCertPath;

        expect(nestConfigService.get).toHaveBeenCalledWith('GISS_CERT_PATH');
        expect(result).toBe(mockPath);
      });
    });

    describe('gissCertPassword', () => {
      it('should return the GISS_CERT_PASSWORD value', () => {
        const mockPassword = 'cert-password';
        nestConfigService.get.mockReturnValue(mockPassword);

        const result = sut.gissCertPassword;

        expect(nestConfigService.get).toHaveBeenCalledWith('GISS_CERT_PASSWORD');
        expect(result).toBe(mockPassword);
      });
    });

    describe('interProviderEnabled', () => {
      it('should return the INTER_PROVIDER_ENABLED value as boolean', () => {
        nestConfigService.get.mockReturnValue(true);

        const result = sut.interProviderEnabled;

        expect(nestConfigService.get).toHaveBeenCalledWith('INTER_PROVIDER_ENABLED');
        expect(result).toBe(true);
      });

      it('should return false when INTER_PROVIDER_ENABLED is undefined', () => {
        nestConfigService.get.mockReturnValue(undefined);

        const result = sut.interProviderEnabled;

        expect(result).toBe(false);
      });
    });

    describe('interApiUrl', () => {
      it('should return the INTER_API_URL value', () => {
        const mockUrl = 'https://cdpj-sandbox.partners.uatinter.co';
        nestConfigService.get.mockReturnValue(mockUrl);

        const result = sut.interApiUrl;

        expect(nestConfigService.get).toHaveBeenCalledWith('INTER_API_URL');
        expect(result).toBe(mockUrl);
      });
    });

    describe('interClientId', () => {
      it('should return the INTER_CLIENT_ID value', () => {
        const mockClientId = 'inter-client-id';
        nestConfigService.get.mockReturnValue(mockClientId);

        const result = sut.interClientId;

        expect(nestConfigService.get).toHaveBeenCalledWith('INTER_CLIENT_ID');
        expect(result).toBe(mockClientId);
      });
    });

    describe('interClientSecret', () => {
      it('should return the INTER_CLIENT_SECRET value', () => {
        const mockClientSecret = 'inter-client-secret';
        nestConfigService.get.mockReturnValue(mockClientSecret);

        const result = sut.interClientSecret;

        expect(nestConfigService.get).toHaveBeenCalledWith('INTER_CLIENT_SECRET');
        expect(result).toBe(mockClientSecret);
      });
    });

    describe('interCertPath', () => {
      it('should return the INTER_CERT_PATH value', () => {
        const mockPath = '/certs/inter.crt';
        nestConfigService.get.mockReturnValue(mockPath);

        const result = sut.interCertPath;

        expect(nestConfigService.get).toHaveBeenCalledWith('INTER_CERT_PATH');
        expect(result).toBe(mockPath);
      });
    });

    describe('interKeyPath', () => {
      it('should return the INTER_KEY_PATH value', () => {
        const mockPath = '/certs/inter.key';
        nestConfigService.get.mockReturnValue(mockPath);

        const result = sut.interKeyPath;

        expect(nestConfigService.get).toHaveBeenCalledWith('INTER_KEY_PATH');
        expect(result).toBe(mockPath);
      });
    });

    describe('interWebhookToken', () => {
      it('should return the INTER_WEBHOOK_TOKEN value', () => {
        const mockToken = 'dev-inter-webhook-token';
        nestConfigService.get.mockReturnValue(mockToken);

        const result = sut.interWebhookToken;

        expect(nestConfigService.get).toHaveBeenCalledWith('INTER_WEBHOOK_TOKEN');
        expect(result).toBe(mockToken);
      });

      it('should return empty string when INTER_WEBHOOK_TOKEN is undefined', () => {
        nestConfigService.get.mockReturnValue(undefined);

        const result = sut.interWebhookToken;

        expect(result).toBe('');
      });
    });
  });

  describe('throttle properties', () => {
    describe('throttleLimit', () => {
      it('should return the THROTTLE_LIMIT value as number', () => {
        const mockLimit = 100;
        nestConfigService.get.mockReturnValue(mockLimit);

        const result = sut.throttleLimit;

        expect(nestConfigService.get).toHaveBeenCalledWith('THROTTLE_LIMIT');
        expect(result).toBe(mockLimit);
      });
    });

    describe('throttleTtlMs', () => {
      it('should return the THROTTLE_TTL_MS value as number', () => {
        const mockTtl = 60_000;
        nestConfigService.get.mockReturnValue(mockTtl);

        const result = sut.throttleTtlMs;

        expect(nestConfigService.get).toHaveBeenCalledWith('THROTTLE_TTL_MS');
        expect(result).toBe(mockTtl);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should call nestConfigService.get for each property access', () => {
      nestConfigService.get
        .mockReturnValueOnce(Environment.Development)
        .mockReturnValueOnce(3000)
        .mockReturnValueOnce('localhost');

      sut.nodeEnv;
      sut.port;
      sut.corsOrigin;

      expect(nestConfigService.get).toHaveBeenCalledTimes(3);
      expect(nestConfigService.get).toHaveBeenNthCalledWith(1, 'NODE_ENV');
      expect(nestConfigService.get).toHaveBeenNthCalledWith(2, 'PORT');
      expect(nestConfigService.get).toHaveBeenNthCalledWith(3, 'CORS_ORIGIN');
    });
  });
});
