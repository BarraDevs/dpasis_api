export enum AlertType {
  NfseStuck = 'nfse-stuck',
  NfseIssuedWithoutBankPayment = 'nfse-issued-without-bank-payment',
  NfseAwaitingProvider = 'nfse-awaiting-provider',
  NfseBankPaymentFailed = 'nfse-bank-payment-failed',
  NfseDailyClosing = 'nfse-daily-closing',
}
