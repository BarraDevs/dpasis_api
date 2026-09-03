export interface ILoggerGateway {
  debug<T extends LogContext>(context: T, data: LogContextDataMap[T]): void
  error<T extends LogContext>(context: T, data: LogContextDataMap[T]): void
}

export enum LogContext {
  HTTP = 'http',
  WS = 'ws',
  CACHE = 'cache',
  SMTP = 'smtp',
  UPLOAD_FILE = 'upload-file',
  CEP_LOOKUP = 'cep-lookup',
  CNPJ_LOOKUP = 'cnpj-lookup',
  NF_GENERATION = 'nf-generation',
  NFS_GENERATION = 'nfs-generation',
  BANK_PAYMENT = 'bank-payment',
}

type LogContextDataMap = {
  [LogContext.HTTP]: HttpData
  [LogContext.WS]: WsData
  [LogContext.CACHE]: CacheData
  [LogContext.SMTP]: SmtpData
  [LogContext.UPLOAD_FILE]: UploadFileData
  [LogContext.CEP_LOOKUP]: CepLookupData
  [LogContext.CNPJ_LOOKUP]: CnpjLookupData
  [LogContext.NF_GENERATION]: NfGenerationData
  [LogContext.NFS_GENERATION]: NfsGenerationData
  [LogContext.BANK_PAYMENT]: BankPaymentData
}

type CommomData = {
  accountId?: string;
  error?: any;
  adapter?: string;
}

type HttpData = CommomData & {
  method: string;
  url: string;
  body: any;
  params: any;
  query: any;
  statusCode: number;
}

type WsData = CommomData & {
  socketId: string;
  event: string;
  data: any;
  predictionId?: string;
}

type CacheData = CommomData & {
  action: string;
  key: string | string[];
  value?: any;
  ttlInSeconds?: number;
}

type SmtpData = CommomData & {
  action: string;
  body: any;
}

type UploadFileData = CommomData & {
  action: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileKey?: string;
  publicUrl?: string;
}

type CepLookupData = CommomData & {
  cep: string;
}

type CnpjLookupData = CommomData & {
  cnpj: string;
}

type NfGenerationData = CommomData & {
  action: string;
  externalId?: number;
  accessKey?: string;
  format?: string;
  query?: any;
}

type NfsGenerationData = CommomData & {
  action: string;
  nfseId?: number;
  batchProtocol?: string;
  batchNumber?: number;
  nfseNumber?: string;
  errorMessage?: string;
}

type BankPaymentData = CommomData & {
  action: string;
  nfseId?: number;
  scope?: string;
  requestCode?: string;
}
