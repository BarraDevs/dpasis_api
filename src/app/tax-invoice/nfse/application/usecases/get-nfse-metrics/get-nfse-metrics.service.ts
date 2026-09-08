import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseQueueMonitor } from '../../queue/nfse-queue-monitor.interface';
import { GetNfseMetricsOutputDto } from './dtos/get-nfse-metrics.dto';

/** Mesmos limiares dos alertas: o número da tela e o número do e-mail não podem discordar. */
const STUCK_THRESHOLD_IN_MINUTES = 120;
const ISSUED_WITHOUT_BANK_PAYMENT_THRESHOLD_IN_MINUTES = 60;
const PROVIDER_STATS_WINDOW_IN_MINUTES = 24 * 60;

@Injectable()
export class GetNfseMetrics {
  constructor(
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfseQueueMonitor) private readonly queueMonitor: INfseQueueMonitor,
  ) {}

  /**
   * Retrato do fluxo em números.
   *
   * Até aqui, descobrir o que estava preso significava `psql`: a lista administrativa não filtrava
   * por status e o Bull Board só mostra jobs vivos. Sem contagem, o tempo até detectar um incidente
   * era indeterminado — e o prazo de cancelamento de uma nota errada é de 30 dias.
   */
  public async execute(): Promise<GetNfseMetricsOutputDto> {
    const [byStatus, bankPaymentByStatus, stuck, issuedWithoutBankPayment, providerCalls, queues] = await Promise.all([
      this.nfseDao.countByStatus(),
      this.nfseDao.countByBankPaymentStatus(),
      this.nfseDao.countStuck(STUCK_THRESHOLD_IN_MINUTES),
      this.nfseDao.countIssuedWithoutBankPayment(ISSUED_WITHOUT_BANK_PAYMENT_THRESHOLD_IN_MINUTES),
      this.nfseDao.findProviderCallStats(PROVIDER_STATS_WINDOW_IN_MINUTES),
      this.queueMonitor.getDepth(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      byStatus,
      stuck,
      issuedWithoutBankPayment,
      bankPaymentByStatus,
      providerCalls,
      queues,
    };
  }
}
