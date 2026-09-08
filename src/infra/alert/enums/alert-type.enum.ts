export enum AlertType {
  NfseStuck = 'nfse-stuck',
  NfseIssuedWithoutBankPayment = 'nfse-issued-without-bank-payment',
  NfseAwaitingProvider = 'nfse-awaiting-provider',
  NfseBankPaymentFailed = 'nfse-bank-payment-failed',
  NfseDailyClosing = 'nfse-daily-closing',
  NfseIssuedWithProviderAlert = 'nfse-issued-with-provider-alert',
  NfmDailyIssuance = 'nfm-daily-issuance',
  CertificateExpiring = 'certificate-expiring',
  QueueBacklog = 'queue-backlog',
  QueueFailed = 'queue-failed',
}
