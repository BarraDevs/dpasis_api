import { CancelNfsInputDto, CancelNfsOutputDto } from './dtos/cancel-nfs.dto';
import { FindNfsByRpsInputDto, FindNfsByRpsOutputDto } from './dtos/find-nfs-by-rps.dto';
import { ListIssuedNfsInputDto, ListIssuedNfsOutputDto } from './dtos/list-issued-nfs.dto';
import { GetNfsBatchStatusInputDto, NfsBatchStatusDto } from './dtos/nfs-batch-status.dto';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from './dtos/issue-nfs-batch.dto';

export interface INfsGenerationGateway {
  issueBatch(input: IssueNfsBatchInputDto): Promise<IssueNfsBatchOutputDto>;
  getBatchStatus(input: GetNfsBatchStatusInputDto): Promise<NfsBatchStatusDto>;
  /** Consulta pela chave natural do RPS. Única fonte capaz de afirmar que a nota não existe. */
  findNfseByRps(input: FindNfsByRpsInputDto): Promise<FindNfsByRpsOutputDto>;
  /** Consulta paginada por período de emissão, para a conciliação em lote. */
  listIssuedNfseByPeriod(input: ListIssuedNfsInputDto): Promise<ListIssuedNfsOutputDto>;
  cancelNfse(input: CancelNfsInputDto): Promise<CancelNfsOutputDto>;
}
