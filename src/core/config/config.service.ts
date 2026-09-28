import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Environment } from './environment.enum';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfigService: NestConfigService) {}

  // environment
  get nodeEnv(): Environment {
    return this.nestConfigService.get<Environment>('NODE_ENV')!;
  }
  get isDevelopment(): boolean {
    return this.nodeEnv === Environment.Development;
  }
  get isProduction(): boolean {
    return this.nodeEnv === Environment.Production;
  }
  get isTest(): boolean {
    return this.nodeEnv === Environment.Test;
  }

  // server
  get port(): number {
    return this.nestConfigService.get<number>('PORT')!;
  }
  get sslKeyPath(): string {
    return this.nestConfigService.get<string>('SSL_KEY')!;
  }
  get sslCertPath(): string {
    return this.nestConfigService.get<string>('SSL_CERT')!;
  }
  get sslCaPath(): string {
    return this.nestConfigService.get<string>('SSL_CA')!;
  }

  // cors
  get corsOrigin(): string {
    return this.nestConfigService.get<string>('CORS_ORIGIN')!;
  }

  // jwt
  get jwtSecret(): string {
    return this.nestConfigService.get<string>('JWT_SECRET')!;
  }

  // database
  get databaseUrl(): string {
    return this.nestConfigService.get<string>('DATABASE_URL')!;
  }

  // upload file
  get awsAccessKeyId(): string {
    return this.nestConfigService.get<string>('AWS_ACCESS_KEY_ID')!;
  }
  get awsSecretAccessKey(): string {
    return this.nestConfigService.get<string>('AWS_SECRET_ACCESS_KEY')!;
  }
  get awsRegion(): string {
    return this.nestConfigService.get<string>('AWS_REGION')!;
  }
  get awsBucketName(): string {
    return this.nestConfigService.get<string>('AWS_BUCKET_NAME')!;
  }

  // smtp
  get smtpHost(): string {
    return this.nestConfigService.get<string>('SMTP_HOST')!;
  }
  get smtpPort(): number {
    return this.nestConfigService.get<number>('SMTP_PORT')!;
  }
  get smtpTo(): string {
    return this.nestConfigService.get<string>('SMTP_TO')!;
  }
  get smtpFrom(): string {
    return this.nestConfigService.get<string>('SMTP_FROM')!;
  }
  get smtpUsername(): string {
    return this.nestConfigService.get<string>('SMTP_USERNAME')!;
  }
  get smtpPassword(): string {
    return this.nestConfigService.get<string>('SMTP_PASSWORD')!;
  }

  // redis
  get redisUrl(): string {
    return this.nestConfigService.get<string>('REDIS_URL')!;
  }
  get redisCacheDatabase(): number {
    return 0;
  }
  get redisQueueDatabase(): number {
    return 1;
  }

  // queue dashboard
  get queueDashboardUsername(): string {
    return this.nestConfigService.get<string>('QUEUE_DASHBOARD_USERNAME')!;
  }
  get queueDashboardPassword(): string {
    return this.nestConfigService.get<string>('QUEUE_DASHBOARD_PASSWORD')!;
  }

  // cnpja
  get cnpjaApiUrl(): string {
    return this.nestConfigService.get<string>('CNPJA_API_URL')!;
  }

  // viacep
  get viacepApiUrl(): string {
    return this.nestConfigService.get<string>('VIACEP_API_URL')!;
  }

  // nfemail
  get nfemailApiUrl(): string {
    return this.nestConfigService.get<string>('NFEMAIL_API_URL')!;
  }
  get nfemailCnpj(): string {
    return this.nestConfigService.get<string>('NFEMAIL_CNPJ')!;
  }
  get nfemailApiKey(): string {
    return this.nestConfigService.get<string>('NFEMAIL_API_KEY')!;
  }

  // gissonline
  get gissProviderEnabled(): boolean {
    return this.nestConfigService.get<boolean>('GISS_PROVIDER_ENABLED') ?? false;
  }
  get gissCertPath(): string {
    return this.nestConfigService.get<string>('GISS_CERT_PATH')!;
  }
  get gissCertPassword(): string {
    return this.nestConfigService.get<string>('GISS_CERT_PASSWORD')!;
  }

  get secretsEncryptionKey(): string {
    return this.nestConfigService.get<string>('SECRETS_ENCRYPTION_KEY')!;
  }

  // throttle
  get throttleLimit(): number {
    return this.nestConfigService.get<number>('THROTTLE_LIMIT') ?? 100; // 100 requests
  }
  get throttleTtlMs(): number {
    return this.nestConfigService.get<number>('THROTTLE_TTL_MS') ?? 60_000; // 1 minute
  }
}
