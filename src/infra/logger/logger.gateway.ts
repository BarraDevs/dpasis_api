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
}

type LogContextDataMap = {
  [LogContext.HTTP]: HttpData
  [LogContext.WS]: WsData
  [LogContext.CACHE]: CacheData
  [LogContext.SMTP]: SmtpData
  [LogContext.UPLOAD_FILE]: UploadFileData
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
  fileName: string;
  fileSize: number;
  fileType: string;
}
