import { AlertType } from 'src/infra/alert/enums/alert-type.enum';

/**
 * Janela de digest por tipo de alerta: um e-mail por janela, listando tudo, em vez de um e-mail por
 * nota. Uma indisponibilidade do Giss não pode virar centenas de mensagens.
 *
 * `AwaitingProvider` tem janela longa de propósito. A reconciliação já tenta resolver esse estado
 * sozinha, com escada de horas a dias: o alerta é lembrete de backlog, não incidente. A cada 15
 * minutos ele viraria ruído, e ruído treina as pessoas a ignorar o canal inteiro.
 */
export const ALERT_WINDOW_IN_SECONDS: Record<AlertType, number> = {
  [AlertType.NfseStuck]: 900, // 15 min
  [AlertType.NfseIssuedWithoutBankPayment]: 900, // 15 min
  [AlertType.NfseAwaitingProvider]: 43_200, // 12h
  [AlertType.NfseBankPaymentFailed]: 900, // 15 min
  [AlertType.NfseDailyClosing]: 82_800, // 23h, para não pular um dia por drift do cron
};

export function buildAlertWindowKey(type: AlertType): string {
  return `alert-window:${type}`;
}
