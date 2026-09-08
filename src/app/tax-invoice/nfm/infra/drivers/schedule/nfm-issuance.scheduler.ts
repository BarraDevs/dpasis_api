import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { RunDailyNfmIssuance } from '../../../application/usecases/run-daily-nfm-issuance/run-daily-nfm-issuance.service';

/**
 * Só agendamento — a lógica (trava, alerta, contadores) vive no use case, que é testável sem timer.
 *
 * 06:00 de Brasília: cedo o bastante para o boleto do dia sair no horário bancário e para a
 * reconciliação D+1 das 07:30 e o fechamento das 08:00 já enxergarem o resultado.
 */
@Injectable()
export class NfmIssuanceScheduler {
  constructor(private readonly runDailyNfmIssuance: RunDailyNfmIssuance) {}

  @Cron('0 6 * * *', { name: 'nfm-daily-issuance', timeZone: SAO_PAULO_TIMEZONE })
  public async runDailyIssuance(): Promise<void> {
    await this.runDailyNfmIssuance.execute();
  }
}
