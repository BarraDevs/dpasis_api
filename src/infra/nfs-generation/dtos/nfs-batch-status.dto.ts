import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export enum NfsBatchSituation {
  NotReceived = 'NOT_RECEIVED',
  Pending = 'PENDING',
  Error = 'ERROR',
  Success = 'SUCCESS',
}

export class GetNfsBatchStatusInputDto {
  /** Só para a trilha de tentativas; o provedor não recebe este campo. */
  nfseId?: number;
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

export enum NfsBatchErrorKind {
  AlreadySubmitted = 'ALREADY_SUBMITTED',
  BusinessRejection = 'BUSINESS_REJECTION',
}

export class NfsBatchErrorDto {
  code: string; // opaco: só mensagem/log — branch de negócio usa `kind`
  message: string;
  kind: NfsBatchErrorKind;
  rpsNumber?: number;
  rpsSeries?: string;
}

export class NfsBatchStatusDto {
  situation: NfsBatchSituation;
  issuedNotes?: NfsIssuedNoteDto[];
  errors?: NfsBatchErrorDto[];
}
