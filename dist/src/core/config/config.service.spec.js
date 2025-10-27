"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const config_service_1 = require("./config.service");
const environment_enum_1 = require("./environment.enum");
describe('ConfigService', () => {
    let sut;
    let nestConfigService;
    beforeEach(async () => {
        const mockNestConfigService = {
            get: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                config_service_1.ConfigService,
                {
                    provide: config_1.ConfigService,
                    useValue: mockNestConfigService,
                },
            ],
        }).compile();
        sut = module.get(config_service_1.ConfigService);
        nestConfigService = module.get(config_1.ConfigService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe.each([
        ...Object.values(environment_enum_1.Environment),
    ])('environment properties', (value) => {
        it(`should return the NODE_ENV value (${value})`, () => {
            nestConfigService.get.mockReturnValue(value);
            const result = sut.nodeEnv;
            expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV');
            expect(result).toBe(value);
        });
        it(`should return true for NODE_ENV value (${value})`, () => {
            nestConfigService.get.mockReturnValue(value);
            expect(sut.isDevelopment).toBe(value === environment_enum_1.Environment.Development);
            expect(sut.isProduction).toBe(value === environment_enum_1.Environment.Production);
            expect(sut.isTest).toBe(value === environment_enum_1.Environment.Test);
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
    });
    describe('integration scenarios', () => {
        it('should call nestConfigService.get for each property access', () => {
            nestConfigService.get
                .mockReturnValueOnce(environment_enum_1.Environment.Development)
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
//# sourceMappingURL=config.service.spec.js.map