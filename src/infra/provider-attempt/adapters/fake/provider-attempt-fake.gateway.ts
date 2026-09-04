import { Injectable } from '@nestjs/common';
import { ProviderAttemptDto } from '../../dtos/provider-attempt.dto';
import type { IProviderAttemptRecorder } from '../../provider-attempt.gateway';

@Injectable()
export class ProviderAttemptFakeAdapterGateway implements IProviderAttemptRecorder {
  public readonly attempts: ProviderAttemptDto[] = [];

  public async record(attempt: ProviderAttemptDto): Promise<void> {
    this.attempts.push(attempt);
  }
}
