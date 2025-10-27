import { ConfigService as NestConfigService } from '@nestjs/config';
import { Environment } from './environment.enum';
export declare class ConfigService {
    private readonly nestConfigService;
    constructor(nestConfigService: NestConfigService);
    get nodeEnv(): Environment;
    get isDevelopment(): boolean;
    get isProduction(): boolean;
    get isTest(): boolean;
    get port(): number;
    get sslKeyPath(): string;
    get sslCertPath(): string;
    get sslCaPath(): string;
    get corsOrigin(): string;
    get jwtSecret(): string;
    get databaseUrl(): string;
    get awsAccessKeyId(): string;
    get awsSecretAccessKey(): string;
    get awsRegion(): string;
    get awsBucketName(): string;
    get smtpHost(): string;
    get smtpPort(): number;
    get smtpTo(): string;
    get smtpFrom(): string;
    get smtpUsername(): string;
    get smtpPassword(): string;
    get redisUrl(): string;
}
