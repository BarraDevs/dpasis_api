import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { NfsGenerationFakeAdapterGateway } from './adapters/fake/nfs-generation-fake.gateway';
import { NfsGenerationGissAdapterGateway } from './adapters/giss/nfs-generation-giss.gateway';

@Module({})
export class NfsGenerationModule {
  /**
   * O Giss é lento no fechamento e o `RecepcionarLoteRps` aceita até 50 RPS por lote, então a folga
   * é generosa. Sem isso o axios roda com o default (nenhum timeout) e uma conexão pendurada segura
   * o worker inteiro — a fila `nfse` roda com concorrência 1.
   */
  private static readonly HTTP_TIMEOUT_MS = 60_000;

  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: NfsGenerationModule,
      imports: [
        ConfigModule,
        HttpModule.register({ timeout: NfsGenerationModule.HTTP_TIMEOUT_MS }),
      ],
      providers: [
        {
          provide: TOKENS.NfsGenerationGateway,
          useClass: isTest ? NfsGenerationFakeAdapterGateway : NfsGenerationGissAdapterGateway,
        },
      ],
      exports: [
        TOKENS.NfsGenerationGateway,
      ],
    };
  }
}
