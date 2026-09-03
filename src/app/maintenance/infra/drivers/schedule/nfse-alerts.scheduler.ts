import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { SweepNfseAlerts } from '../../../application/usecases/sweep-nfse-alerts/sweep-nfse-alerts.service';

/**
 * Só agendamento — a lógica vive no use case, que é testável sem timer.
 *
 * As varreduras rodam em sequência e cada uma trata o próprio erro, para que uma consulta que falhe
 * não impeça as outras de alertar.
 */
@Injectable()
export class NfseAlertsScheduler {
  constructor(private readonly sweepNfseAlerts: SweepNfseAlerts) {}

  @Cron('*/15 * * * *', { name: 'nfse-alerts', timeZone: SAO_PAULO_TIMEZONE })
  public async runFrequentSweeps(): Promise<void> {
    await Promise.allSettled([
      this.sweepNfseAlerts.sweepStuck(),
      this.sweepNfseAlerts.sweepIssuedWithoutBankPayment(),
      this.sweepNfseAlerts.sweepAwaitingProvider(),
    ]);
  }

  @Cron('0 8 * * *', { name: 'nfse-daily-closing', timeZone: SAO_PAULO_TIMEZONE })
  public async runDailyClosing(): Promise<void> {
    await this.sweepNfseAlerts.sweepDailyClosing();
  }
}
