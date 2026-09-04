import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { NfseAlertRowDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-alert-row.dto';
import type { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ALERT_WINDOW_IN_SECONDS, buildAlertWindowKey } from '../../alert-window';

const STUCK_THRESHOLD_IN_MINUTES = 120;
const ISSUED_WITHOUT_BANK_PAYMENT_THRESHOLD_IN_MINUTES = 60;

@Injectable()
export class SweepNfseAlerts {
  constructor(
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.AlertGateway) private readonly alertGateway: IAlertGateway,
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
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

  /**
   * Cobranças que o provedor recusou produzir (`FALHA_EMISSAO`). A NFS-e está `ISSUED` e vinculada
   * — parece saudável em toda consulta —, e o cliente nunca recebeu boleto. Sem alerta, a
   * inadimplência resultante parece do cliente.
   */
  public async sweepBankPaymentFailed(): Promise<void> {
    const rows = await this.nfseDao.findBankPaymentFailed();

    await this.sendIfAny(
      AlertType.NfseBankPaymentFailed,
      `[NFS-e] ${rows.length} cobrança(s) com falha registrada`,
      rows,
      ['Conferir a situação no provedor antes de reemitir; o vínculo local não foi apagado.'],
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
   *
   * Duas assimetrias deliberadas, porque um alerta que não sai custa o incidente inteiro:
   *
   * - **Falha ao reivindicar não é permissão negada.** Se o Redis está fora do ar, `setIfAbsent`
   *   lança, e aqui isso vira "envia assim mesmo". Um e-mail duplicado por réplica é incômodo; um
   *   e-mail que não sai durante uma indisponibilidade é o silêncio exato que o canal existe para
   *   evitar — e Redis tende a cair junto com o resto.
   * - **Envio que falhou devolve a janela.** Sem isso, um `sendMail` recusado queimaria a janela
   *   inteira: 15 minutos de silêncio nos alertas curtos, 12h no de `AWAITING_PROVIDER`.
   */
  private async send(type: AlertType, subject: string, lines: string[]): Promise<void> {
    const key = buildAlertWindowKey(type);
    let claimed: boolean;

    try {
      claimed = await this.cacheGateway.setIfAbsent(key, new Date().toISOString(), ALERT_WINDOW_IN_SECONDS[type]);
    }
    catch (error: unknown) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'setIfAbsent',
        key,
        error,
      });
      claimed = true;
    }

    if (!claimed) {
      return;
    }

    const delivered = await this.alertGateway.send({ type, subject, lines });
    if (!delivered) {
      await this.cacheGateway.delete(key);
    }
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
