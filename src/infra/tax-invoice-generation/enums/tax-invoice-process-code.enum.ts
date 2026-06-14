// https://www.nfemail.com.br/ManualAPI/GETapiNotasFiscaisId.htm
export enum TaxInvoiceProcessCode {
  DRAFT = -1,
  VALIDATED = -2,
  PREPARING_SIGNATURE = 0,
  SIGNING = -3,
  PROCESSING_AUTHORIZATION = -13,
  BATCH_PROCESSING = -105,
  SENT = -99,
  AUTHORIZED = 100,
  REJECTED = -77,
  CANCELLED = 101,
  DENIED_ISSUER = 301,
  DENIED_RECIPIENT = 302,
}
