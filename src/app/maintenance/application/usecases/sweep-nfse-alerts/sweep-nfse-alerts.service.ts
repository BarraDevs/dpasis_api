import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { NfseAlertRowDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-alert-row.dto';
import type { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { ALERT_WINDOW_IN_SECONDS, buildAlertWindowKey } from '../../alert-window';

const STUCK_THRESHOLD_IN_MINUTES = 120;
const ISSUED_WITHOUT_BANK_PAYMENT_THRESHOLD_IN_MINUTES = 60;

@Injectable()
export class SweepNfseAlerts {
  constructor(
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.AlertGateway) private readonly alertGateway: IAlertGateway,
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
  ) {}

  /** NFS-e presa em estado não terminal: enviada e sem desfecho. */
  public async sweepStuck(): Promise<void> {
    const rows = await this.nfseDao.findStuck(STUCK_THRESHOLD_IN_MINUTES);

    await this.sendIfAny(
      AlertType.NfseStuck,
      `[NFS-e] ${rows.length} nota(s) sem desfecho há mais de ${STUCK_THRESHOLD_IN_MINUTES / 60}h`,
      rows,
    );
  }

  /** Nota emitida e cliente sem boleto: o ciclo financeiro não fechou. */
  public async sweepIssuedWithoutBankPayment(): Promise<void> {
    const rows = await this.nfseDao.findIssuedWithoutBankPayment(ISSUED_WITHOUT_BANK_PAYMENT_THRESHOLD_IN_MINUTES);

    await this.sendIfAny(
      AlertType.NfseIssuedWithoutBankPayment,
      `[NFS-e] ${rows.length} nota(s) emitida(s) sem cobrança vinculada`,
      rows,
    );
  }

  /**
   * Notas em `AWAITING_PROVIDER`: o provedor pode tê-las emitido e não sabemos. Nada as resolve
   * automaticamente até a reconciliação da Onda 3 — por isso a janela é longa e o texto pede ação
   * manual em vez de sugerir que o sistema vai se recuperar sozinho.
   */
  public async sweepAwaitingProvider(): Promise<void> {
    const rows = await this.nfseDao.findAwaitingProvider();

    await this.sendIfAny(
      AlertType.NfseAwaitingProvider,
      `[NFS-e] ${rows.length} nota(s) aguardando confirmação do provedor`,
      rows,
      ['Consultar cada uma no portal do provedor antes de reemitir. Reemitir às cegas duplica a nota.'],
    );
  }

  /** Fechamento D+1: emitidas no dia anterior contra as que têm boleto. */
  public async sweepDailyClosing(now: Date = new Date()): Promise<void> {
    const yesterday = DateTime.fromJSDate(now).setZone(SAO_PAULO_TIMEZONE).minus({ days: 1 });
    const dayStart = yesterday.startOf('day');
    const dayEnd = dayStart.plus({ days: 1 });

    const closing = await this.nfseDao.countIssuedByDay(dayStart.toJSDate(), dayEnd.toJSDate());

    if (closing.issued === closing.withBankPayment) {
      return;
    }

    await this.send(AlertType.NfseDailyClosing, `[NFS-e] Divergência no fechamento de ${dayStart.toFormat('dd/MM/yyyy')}`, [
      `Emitidas: ${closing.issued}`,
      `Com boleto: ${closing.withBankPayment}`,
      `Sem boleto: ${closing.issued - closing.withBankPayment}`,
    ]);
  }

  private async sendIfAny(type: AlertType, subject: string, rows: NfseAlertRowDto[], footer: string[] = []): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const lines = rows.map((row) => SweepNfseAlerts.formatRow(row));
    await this.send(type, subject, footer.length > 0 ? [...lines, '', ...footer] : lines);
  }

  /**
   * A janela é reivindicada antes do envio, de forma atômica. É isso que impede duas instâncias de
   * mandarem o mesmo alerta: as duas consultam, mas só uma ganha a chave.
   */
  private async send(type: AlertType, subject: string, lines: string[]): Promise<void> {
    const claimed = await this.cacheGateway.setIfAbsent(
      buildAlertWindowKey(type),
      new Date().toISOString(),
      ALERT_WINDOW_IN_SECONDS[type],
    );

    if (!claimed) {
      return;
    }

    await this.alertGateway.send({ type, subject, lines });
  }

  private static formatRow(row: NfseAlertRowDto): string {
    const parts = [`nfseId=${row.id}`, `status=${row.status}`];

    if (row.nfseNumber) {
      parts.push(`nfse=${row.nfseNumber}`);
    }
    parts.push(`atualizada=${DateTime.fromJSDate(row.updatedAt).setZone(SAO_PAULO_TIMEZONE).toFormat('dd/MM/yyyy HH:mm')}`);
    if (row.errorMessage) {
      parts.push(`motivo="${row.errorMessage}"`);
    }

    return parts.join(' · ');
  }
}
