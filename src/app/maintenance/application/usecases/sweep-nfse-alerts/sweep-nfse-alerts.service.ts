import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { NfseAlertRowDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-alert-row.dto';
import type { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import type { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import type { INfseQueueMonitor } from 'src/app/tax-invoice/nfse/application/queue/nfse-queue-monitor.interface';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ALERT_WINDOW_IN_SECONDS, buildAlertWindowKey } from 'src/infra/alert/alert-window';
import {
  CERTIFICATE_WARNING_THRESHOLDS_IN_DAYS,
  CheckCertificates,
} from '../check-certificates/check-certificates.service';
import { CertificateHealthStatus } from '../check-certificates/dtos/check-certificates.dto';

const STUCK_THRESHOLD_IN_MINUTES = 120;
const ISSUED_WITHOUT_BANK_PAYMENT_THRESHOLD_IN_MINUTES = 60;

/**
 * Acima disso a fila deixou de ser fila e virou represa. O pior caso conhecido é o fechamento de um
 * dia (~300 notas com a escada de consulta), então o limiar fica acima do normal e abaixo do
 * anormal.
 */
const QUEUE_BACKLOG_THRESHOLD = 200;

@Injectable()
export class SweepNfseAlerts {
  constructor(
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.AlertGateway) private readonly alertGateway: IAlertGateway,
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly checkCertificates: CheckCertificates,
    @Inject(TOKENS.NfseQueueMonitor) private readonly queueMonitor: INfseQueueMonitor,
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

  /**
   * Notas emitidas **com ressalva do fisco** (códigos `A*`): inscrição municipal paralisada, prazo
   * de conversão do RPS vencido, opção pelo Simples fora do cadastro. A nota existe e é válida, mas
   * exige ação junto à Prefeitura — é a categoria de problema que não quebra nada hoje e vira
   * autuação ou glosa depois.
   *
   * Ao contrário das outras varreduras, esta marca as notas como avisadas: sem isso o mesmo `A10`
   * voltaria a cada 15 minutos até alguém resolver com a Prefeitura, e um alerta que se repete sem
   * novidade é o caminho mais curto para o canal inteiro ser ignorado. A marcação só acontece se o
   * e-mail saiu.
   */
  public async sweepProviderAlerts(): Promise<void> {
    const rows = await this.nfseDao.findIssuedWithProviderAlerts();

    const delivered = await this.sendIfAny(
      AlertType.NfseIssuedWithProviderAlert,
      `[NFS-e] ${rows.length} nota(s) emitida(s) com ressalva do fisco`,
      rows,
      ['A nota foi emitida. As ressalvas exigem regularização junto à Prefeitura.'],
    );

    if (delivered) {
      await this.nfseRepository.markProviderAlertsNotified(rows.map((row) => row.id), new Date());
    }
  }

  /**
   * Certificados a vencer.
   *
   * Vive aqui, e não numa varredura própria, porque o que importa é a disciplina de janela: um
   * certificado que vence em 30 dias continua vencendo em 30 dias amanhã, e sem digest o alerta
   * diário viraria ruído — que treina as pessoas a ignorar o canal inteiro.
   *
   * A emissão fiscal para inteira quando o certificado vence: o handshake TLS falha e todas as notas
   * do dia ficam sem desfecho. É evento com data marcada, e o único jeito de ele não virar incidente
   * é avisar antes.
   */
  public async sweepCertificates(): Promise<void> {
    const health = await this.checkCertificates.execute();
    const failing = health.certificates.filter((certificate) => certificate.status !== CertificateHealthStatus.Ok);

    if (failing.length === 0) {
      return;
    }

    const lines = failing.map((certificate) => [
      `provedor=${certificate.provider}`,
      `dono=${certificate.owner}`,
      `situação=${certificate.status}`,
      certificate.notAfter ? `vence=${DateTime.fromISO(certificate.notAfter).setZone(SAO_PAULO_TIMEZONE).toFormat('dd/MM/yyyy')}` : null,
      certificate.daysToExpire !== null ? `dias=${certificate.daysToExpire}` : null,
      certificate.message ? `motivo="${certificate.message}"` : null,
    ].filter(Boolean).join(' · '));

    await this.send(
      AlertType.CertificateExpiring,
      `[Certificados] ${failing.length} certificado(s) exigindo atenção`,
      [
        ...lines,
        '',
        `Limiares de aviso: ${CERTIFICATE_WARNING_THRESHOLDS_IN_DAYS.join(', ')} dias. Renovar junto à AC leva dias.`,
      ],
    );
  }

  /**
   * Filas paradas e jobs que esgotaram as tentativas.
   *
   * Um job que falha depois de todas as tentativas fica retido 30 dias no Redis desde a Onda 1 — mas
   * só aparece para quem abrir o Bull Board por acaso, que é exatamente a dependência que o canal de
   * alerta existe para eliminar. Backlog e DLQ são dois sintomas diferentes: o primeiro diz que o
   * provedor está lento, o segundo que alguma coisa desistiu.
   */
  public async sweepQueues(): Promise<void> {
    const depths = await this.queueMonitor.getDepth();

    const backlogged = depths.filter((depth) => depth.waiting + depth.delayed > QUEUE_BACKLOG_THRESHOLD);
    const failed = depths.filter((depth) => depth.failed > 0);

    if (backlogged.length > 0) {
      await this.send(
        AlertType.QueueBacklog,
        `[Filas] ${backlogged.length} fila(s) acima de ${QUEUE_BACKLOG_THRESHOLD} jobs pendentes`,
        backlogged.map((depth) => `fila=${depth.queue} · aguardando=${depth.waiting} · atrasados=${depth.delayed} · ativos=${depth.active}`),
      );
    }

    if (failed.length > 0) {
      await this.send(
        AlertType.QueueFailed,
        `[Filas] ${failed.reduce((total, depth) => total + depth.failed, 0)} job(s) na fila de falhas`,
        [
          ...failed.map((depth) => `fila=${depth.queue} · falhados=${depth.failed}`),
          '',
          'Reprocessar pelo Bull Board em /admin/queues, depois de conferir o estado da nota.',
        ],
      );
    }
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

  /** Devolve `true` só quando esta instância entregou o alerta — é o gatilho de quem marca estado. */
  private async sendIfAny(type: AlertType, subject: string, rows: NfseAlertRowDto[], footer: string[] = []): Promise<boolean> {
    if (rows.length === 0) {
      return false;
    }

    const lines = rows.map((row) => SweepNfseAlerts.formatRow(row));
    return this.send(type, subject, footer.length > 0 ? [...lines, '', ...footer] : lines);
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
  private async send(type: AlertType, subject: string, lines: string[]): Promise<boolean> {
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
      return false;
    }

    const delivered = await this.alertGateway.send({ type, subject, lines });
    if (!delivered) {
      await this.cacheGateway.delete(key);
    }

    return delivered;
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
    if (row.providerAlerts) {
      parts.push(`ressalvas="${row.providerAlerts}"`);
    }

    return parts.join(' · ');
  }
}
