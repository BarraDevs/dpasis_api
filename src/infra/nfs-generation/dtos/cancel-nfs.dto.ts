import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export class CancelNfsInputDto {
  nfseNumber: string;
  providerDocument: string;
  providerMunicipalCodeIbge: string;
  providerMunicipalRegistration?: string;
  cancelReasonCode: number;
  provider: NfsProviderCredentialsDto;
}

export class CancelNfsOutputDto {
  confirmedAt: string;
}
