export class ReissueNfseBankPaymentInputDto {
  nfseId: number;
  /** Por que o operador decidiu reemitir; vai para a trilha de auditoria. */
  reason: string;
}

export class ReissueNfseBankPaymentOutputDto {
  nfseId: number;
  /** A cobrança com falha que deixou de estar vinculada. Continua no provedor, sem cobrar ninguém. */
  replacedRequestCode: string;
}
