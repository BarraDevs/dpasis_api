import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';
import { NfsRpsDto } from './nfs-rps.dto';

export class IssueNfsBatchInputDto {
  batchNumber: number;
  provider: NfsProviderCredentialsDto;
  rpsList: NfsRpsDto[];
}

export class IssueNfsBatchOutputDto {
  batchProtocol: string;
}
