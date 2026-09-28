import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { ConfigService } from './config.service';
import { Environment } from './environment.enum';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: `.env.${process.env.NODE_ENV || Environment.Development}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid(...Object.values(Environment)).required(),

        PORT: Joi.number().required(),
        SSL_KEY: Joi.string().required(),
        SSL_CERT: Joi.string().required(),
        SSL_CA: Joi.string().required(),

        CORS_ORIGIN: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),

        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_BUCKET_NAME: Joi.string().required(),

        SMTP_HOST: Joi.string().required(),
        // Numérica, não string: um valor de fachada passava na validação, virava `NaN` dentro do
        // nodemailer e derrubava todo envio em silêncio — `send()` devolvia `false` e o alerta
        // ficava só no log. Falhar no boot troca um canal morto por uma mensagem.
        SMTP_PORT: Joi.number().port().required(),
        SMTP_TO: Joi.string().required(),
        SMTP_FROM: Joi.string().required(),
        SMTP_USERNAME: Joi.string().required(),
        SMTP_PASSWORD: Joi.string().required(),

        REDIS_URL: Joi.string().required(),

        QUEUE_DASHBOARD_USERNAME: Joi.string().required(),
        QUEUE_DASHBOARD_PASSWORD: Joi.string().required(),

        CNPJA_API_URL: Joi.string().required(),
        VIACEP_API_URL: Joi.string().required(),

        NFEMAIL_API_URL: Joi.string().required(),
        NFEMAIL_CNPJ: Joi.string().required(),
        NFEMAIL_API_KEY: Joi.string().required(),

        GISS_PROVIDER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
        GISS_CERT_PATH: Joi.when('GISS_PROVIDER_ENABLED', {
          is: true,
          then: Joi.string().required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        GISS_CERT_PASSWORD: Joi.when('GISS_PROVIDER_ENABLED', {
          is: true,
          then: Joi.string().required(),
          otherwise: Joi.string().optional().allow(''),
        }),

        SECRETS_ENCRYPTION_KEY: Joi.string().hex().length(64).required(),

        THROTTLE_LIMIT: Joi.number().integer().min(2),
        THROTTLE_TTL_MS: Joi.number().integer().min(1_000),
      }),
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
