import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export enum NfsBatchSituation {
  NotReceived = 'NOT_RECEIVED',
  Pending = 'PENDING',
  Error = 'ERROR',
  Success = 'SUCCESS',
}

export class GetNfsBatchStatusInputDto {
  batchProtocol: string;
  providerDocument: string; // CNPJ/CPF do prestador, exigido pra consultar o lote
  provider: NfsProviderCredentialsDto;
}

export class NfsIssuedNoteDto {
  rpsNumber: number;
  rpsSeries: string;
  nfseNumber: string;
  verificationCode: string;
  issueDate: string; // ISO datetime
}

export class NfsBatchErrorDto {
  code: string;
  message: string;
  rpsNumber?: number;
  rpsSeries?: string;
}

export class NfsBatchStatusDto {
  situation: NfsBatchSituation;
  issuedNotes?: NfsIssuedNoteDto[];
  errors?: NfsBatchErrorDto[];
}
