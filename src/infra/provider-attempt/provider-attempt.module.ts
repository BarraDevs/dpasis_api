import { Global, Module } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { ProviderAttemptPrismaAdapterGateway } from './adapters/prisma/provider-attempt-prisma.gateway';

/**
 * Global porque os dois adapters de provedor — GISS e Inter — gravam a mesma trilha e vivem em
 * módulos independentes. O adapter é sempre o de banco, inclusive em teste: diferente do SMTP, a
 * escrita é local e a asserção sobre a linha gravada é justamente o que os testes de integração
 * precisam ver.
 */
@Global()
@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
  ],
  providers: [
    {
      provide: TOKENS.ProviderAttemptRecorder,
      useClass: ProviderAttemptPrismaAdapterGateway,
    },
  ],
  exports: [
    TOKENS.ProviderAttemptRecorder,
  ],
})
export class ProviderAttemptModule {}
