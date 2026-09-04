import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';
import { NfsRpsDto } from './nfs-rps.dto';

export class IssueNfsBatchInputDto {
  /** Só para a trilha de tentativas; o provedor não recebe este campo. */
  nfseId?: number;
  batchNumber: number;
  provider: NfsProviderCredentialsDto;
  rpsList: NfsRpsDto[];
}

export class IssueNfsBatchOutputDto {
  batchProtocol: string;
}
