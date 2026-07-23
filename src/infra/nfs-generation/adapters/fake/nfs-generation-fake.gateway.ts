/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { GetNfsBatchStatusInputDto, NfsBatchStatusDto } from '../../dtos/nfs-batch-status.dto';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from '../../dtos/issue-nfs-batch.dto';
import { INfsGenerationGateway } from '../../nfs-generation.gateway';

@Injectable()
export class NfsGenerationFakeAdapterGateway implements INfsGenerationGateway {
  issueBatch(_input: IssueNfsBatchInputDto): Promise<IssueNfsBatchOutputDto> {
    throw new Error('Method not implemented.');
  }
  getBatchStatus(_input: GetNfsBatchStatusInputDto): Promise<NfsBatchStatusDto> {
    throw new Error('Method not implemented.');
  }
}
