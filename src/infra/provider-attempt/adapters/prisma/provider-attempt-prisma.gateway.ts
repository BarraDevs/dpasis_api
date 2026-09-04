import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ProviderAttemptDto } from '../../dtos/provider-attempt.dto';
import type { IProviderAttemptRecorder } from '../../provider-attempt.gateway';

@Injectable()
export class ProviderAttemptPrismaAdapterGateway implements IProviderAttemptRecorder {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  public async record(attempt: ProviderAttemptDto): Promise<void> {
    try {
      await this.prisma.nfseAttempt.create({
        data: {
          nfseId: attempt.nfseId,
          operation: attempt.operation,
          requestBody: attempt.requestBody ?? null,
          responseBody: attempt.responseBody ?? null,
          httpStatus: attempt.httpStatus ?? null,
          errorClass: attempt.errorClass ?? null,
          durationMs: attempt.durationMs ?? null,
        },
      });
    }
    catch (error: unknown) {
      this.logger.error(LogContext.PROVIDER_ATTEMPT, {
        adapter: 'provider-attempt',
        action: 'record',
        nfseId: attempt.nfseId,
        operation: attempt.operation,
        error,
      });
    }
  }
}
