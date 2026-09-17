import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { SweepNfseAlerts } from '../../../application/usecases/sweep-nfse-alerts/sweep-nfse-alerts.service';
import { SweepNfseRecovery } from '../../../application/usecases/sweep-nfse-recovery/sweep-nfse-recovery.service';
import { ReconcileNfsePeriod } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse-period/reconcile-nfse-period.service';
import { DateTime } from 'luxon';

/**
 * Só agendamento — a lógica vive no use case, que é testável sem timer.
 *
 * As varreduras rodam em sequência e cada uma trata o próprio erro, para que uma consulta que falhe
 * não impeça as outras de alertar.
 */
@Injectable()
export class NfseAlertsScheduler {
  constructor(
    private readonly sweepNfseAlerts: SweepNfseAlerts,
    private readonly sweepNfseRecovery: SweepNfseRecovery,
    private readonly reconcileNfsePeriod: ReconcileNfsePeriod,
  ) {}

  @Cron('*/15 * * * *', { name: 'nfse-alerts', timeZone: SAO_PAULO_TIMEZONE })
  public async runFrequentSweeps(): Promise<void> {
    await Promise.allSettled([
      this.sweepNfseAlerts.sweepStuck(),
      this.sweepNfseAlerts.sweepIssuedWithoutBankPayment(),
      this.sweepNfseAlerts.sweepAwaitingProvider(),
      this.sweepNfseAlerts.sweepBankPaymentFailed(),
      this.sweepNfseAlerts.sweepProviderAlerts(),
      this.sweepNfseAlerts.sweepQueues(),
    ]);
  }

  /**
   * Recuperação: só enfileira. Cinco minutos é curto o bastante para que uma nota criada e não
   * despachada não fique parada, e longo o bastante para não competir com o despacho normal.
   */
  @Cron('*/5 * * * *', { name: 'nfse-recovery', timeZone: SAO_PAULO_TIMEZONE })
  public async runRecoverySweeps(): Promise<void> {
    await Promise.allSettled([
      this.sweepNfseRecovery.sweepOutbox(),
      this.sweepNfseRecovery.sweepReconciliation(),
      this.sweepNfseRecovery.sweepMissingBankPayment(),
      this.sweepNfseRecovery.sweepBankPaymentRetry(),
      this.sweepNfseRecovery.sweepBankPaymentConfirmation(),
      this.sweepNfseRecovery.sweepBankPaymentSettlement(),
    ]);
  }

  /**
   * Conciliação D+1 por período, meia hora antes do fechamento: a contagem das 08:00 já enxerga o
   * que esta varredura corrigiu. Janela de um dia — o gargalo do provedor é a página de 50 notas.
   */
  @Cron('30 7 * * *', { name: 'nfse-daily-reconciliation', timeZone: SAO_PAULO_TIMEZONE })
  public async runDailyReconciliation(): Promise<void> {
    const yesterday = DateTime.now().setZone(SAO_PAULO_TIMEZONE).minus({ days: 1 }).toFormat('yyyy-MM-dd');

    await this.reconcileNfsePeriod.execute({ startDate: yesterday, endDate: yesterday, dryRun: false });
  }

  @Cron('0 8 * * *', { name: 'nfse-daily-closing', timeZone: SAO_PAULO_TIMEZONE })
  public async runDailyClosing(): Promise<void> {
    await this.sweepNfseAlerts.sweepDailyClosing();
  }

  /**
   * Certificados uma vez por dia: vencimento é evento de dias, não de minutos. Antes do fechamento
   * das 08:00, para que um certificado vencido apareça como aviso e não como a emissão quebrando.
   */
  @Cron('0 7 * * *', { name: 'certificate-expiry', timeZone: SAO_PAULO_TIMEZONE })
  public async runCertificateCheck(): Promise<void> {
    await this.sweepNfseAlerts.sweepCertificates();
  }
}
