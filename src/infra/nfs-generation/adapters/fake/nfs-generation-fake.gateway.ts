import { Injectable } from '@nestjs/common';
import { CancelNfsInputDto, CancelNfsOutputDto } from '../../dtos/cancel-nfs.dto';
import { GetNfsBatchStatusInputDto, NfsBatchSituation, NfsBatchStatusDto } from '../../dtos/nfs-batch-status.dto';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from '../../dtos/issue-nfs-batch.dto';
import { INfsGenerationGateway } from '../../nfs-generation.gateway';

@Injectable()
export class NfsGenerationFakeAdapterGateway implements INfsGenerationGateway {
  public readonly issueBatchCalls: IssueNfsBatchInputDto[] = [];
  public issueBatchResult: IssueNfsBatchOutputDto = { batchProtocol: 'fake-protocol' };
  public issueBatchError: Error | null = null;

  public readonly getBatchStatusCalls: GetNfsBatchStatusInputDto[] = [];
  public getBatchStatusResult: NfsBatchStatusDto = { situation: NfsBatchSituation.Success };
  public getBatchStatusError: Error | null = null;

  public readonly cancelNfseCalls: CancelNfsInputDto[] = [];
  public cancelNfseResult: CancelNfsOutputDto = { confirmedAt: '2026-01-01T00:00:00' };
  public cancelNfseError: Error | null = null;

  public async issueBatch(input: IssueNfsBatchInputDto): Promise<IssueNfsBatchOutputDto> {
    this.issueBatchCalls.push(input);
    if (this.issueBatchError) {
      return Promise.reject(this.issueBatchError);
    }
    return Promise.resolve(this.issueBatchResult);
  }

  public async getBatchStatus(input: GetNfsBatchStatusInputDto): Promise<NfsBatchStatusDto> {
    this.getBatchStatusCalls.push(input);
    if (this.getBatchStatusError) {
      return Promise.reject(this.getBatchStatusError);
    }
    return Promise.resolve(this.getBatchStatusResult);
  }

  public async cancelNfse(input: CancelNfsInputDto): Promise<CancelNfsOutputDto> {
    this.cancelNfseCalls.push(input);
    if (this.cancelNfseError) {
      return Promise.reject(this.cancelNfseError);
    }
    return Promise.resolve(this.cancelNfseResult);
  }
}
