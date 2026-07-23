import { GetNfsBatchStatusInputDto, NfsBatchStatusDto } from './dtos/nfs-batch-status.dto';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from './dtos/issue-nfs-batch.dto';

export interface INfsGenerationGateway {
  issueBatch(input: IssueNfsBatchInputDto): Promise<IssueNfsBatchOutputDto>;
  getBatchStatus(input: GetNfsBatchStatusInputDto): Promise<NfsBatchStatusDto>;
}
