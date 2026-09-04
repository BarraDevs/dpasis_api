import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export class CancelNfsInputDto {
  /** Só para a trilha de tentativas; o provedor não recebe este campo. */
  nfseId?: number;
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
