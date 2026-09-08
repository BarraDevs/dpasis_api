import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import { NfseAlertRowDto, NfseDailyClosingDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-alert-row.dto';
import {
  NfseCountByKeyDto,
  NfseProviderCallStatsDto,
} from 'src/app/tax-invoice/nfse/application/usecases/get-nfse-metrics/dtos/get-nfse-metrics.dto';
import { NfseReconcileTargetDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-reconcile-target.dto';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const NfseSelect = {
  id: true,
  companyId: true,
  clientId: true,
  rpsNumber: true,
  rpsSeries: true,
  status: true,
  batchProtocol: true,
  nfseNumber: true,
  verificationCode: true,
  issuedAt: true,
  errorMessage: true,
  canceledAt: true,
  cancelReasonCode: true,
  bankPaymentProvider: true,
  bankPaymentRequestCode: true,
  bankPaymentIdempotencyKey: true,
  bankPaymentRequestedAt: true,
  bankPaymentErrorMessage: true,
  bankPaymentFailedAt: true,
  bankPaymentStatus: true,
  bankPaymentConfirmedAt: true,
  reconcileAttemptCount: true,
  nextReconcileAt: true,
  nfmId: true,
  data: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NfseSelect;

const NfseAlertRowSelect = {
  id: true,
  status: true,
  nfseNumber: true,
  errorMessage: true,
  issuedAt: true,
  updatedAt: true,
  providerAlerts: true,
} satisfies Prisma.NfseSelect;

const NfseReconcileTargetSelect = {
  id: true,
  companyId: true,
  rpsNumber: true,
  rpsSeries: true,
  status: true,
} satisfies Prisma.NfseSelect;

const NON_TERMINAL_STATUSES = [
  NfseStatus.PENDING,
  NfseStatus.SUBMITTED,
  NfseStatus.PROCESSING,
] satisfies NfseStatus[];

/**
 * O que a reconciliação persegue. Inclui `AWAITING_PROVIDER`, que `NON_TERMINAL_STATUSES` deixa de
 * fora de propósito: para o alerta de "nota presa" ele já tem varredura própria, mas para a
 * reconciliação ele é justamente o caso principal.
 */
const RECONCILABLE_STATUSES = [
  ...NON_TERMINAL_STATUSES,
  NfseStatus.AWAITING_PROVIDER,
] satisfies NfseStatus[];

/** Ordem estável e limite de linhas: o alerta é um resumo, não um dump da tabela. */
const ALERT_QUERY_OPTIONS = {
  select: NfseAlertRowSelect,
  orderBy: { updatedAt: 'asc' },
  take: 200,
} satisfies Omit<Prisma.NfseFindManyArgs, 'where'>;

@Injectable()
export class NfseDaoAdapterPrisma implements INfseDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: number): Promise<NfseDto | null> {
    const row = await this.prisma.nfse.findUnique({
      where: { id },
      select: NfseSelect,
    });
    return row ? this.mapToDto(row) : null;
  }

  public async findStuck(olderThanMinutes: number): Promise<NfseAlertRowDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        status: { in: NON_TERMINAL_STATUSES },
        updatedAt: { lt: NfseDaoAdapterPrisma.minutesAgo(olderThanMinutes) },
      },
      ...ALERT_QUERY_OPTIONS,
    });

    return rows.map((row) => this.mapToAlertRow(row));
  }

  public async findAwaitingProvider(): Promise<NfseAlertRowDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: { status: NfseStatus.AWAITING_PROVIDER },
      ...ALERT_QUERY_OPTIONS,
    });

    return rows.map((row) => this.mapToAlertRow(row));
  }

  public async findIssuedWithoutBankPayment(olderThanMinutes: number): Promise<NfseAlertRowDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: null,
        issuedAt: { lt: NfseDaoAdapterPrisma.minutesAgo(olderThanMinutes) },
      },
      ...ALERT_QUERY_OPTIONS,
    });

    return rows.map((row) => this.mapToAlertRow(row));
  }

  /**
   * Notas emitidas com ressalva do fisco que ninguém viu ainda. Sem limite de tempo: um `A13`
   * ("prazo para conversão do RPS vencido") não fica menos grave por ser de ontem.
   */
  public async findIssuedWithProviderAlerts(): Promise<NfseAlertRowDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        providerAlerts: { not: null },
        providerAlertedAt: null,
      },
      ...ALERT_QUERY_OPTIONS,
    });

    return rows.map((row) => this.mapToAlertRow(row));
  }

  public async countIssuedByDay(dayStart: Date, dayEnd: Date): Promise<NfseDailyClosingDto> {
    const issuedInRange = { issuedAt: { gte: dayStart, lt: dayEnd } };

    const [issued, withBankPayment] = await Promise.all([
      this.prisma.nfse.count({ where: { status: NfseStatus.ISSUED, ...issuedInRange } }),
      this.prisma.nfse.count({
        where: { status: NfseStatus.ISSUED, bankPaymentRequestCode: { not: null }, ...issuedInRange },
      }),
    ]);

    return { issued, withBankPayment };
  }

  public async findBankPaymentFailed(): Promise<NfseAlertRowDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        status: NfseStatus.ISSUED,
        bankPaymentFailedAt: { not: null },
      },
      ...ALERT_QUERY_OPTIONS,
    });

    return rows.map((row) => this.mapToAlertRow(row));
  }

  public async findPendingReconciliation(limit: number): Promise<NfseReconcileTargetDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        status: { in: RECONCILABLE_STATUSES },
        nextReconcileAt: { not: null, lte: new Date() },
      },
      select: NfseReconcileTargetSelect,
      orderBy: { nextReconcileAt: 'asc' },
      take: limit,
    });

    return rows.map((row) => this.mapToReconcileTarget(row));
  }

  public async findPendingByPeriod(periodStart: Date, periodEnd: Date): Promise<NfseReconcileTargetDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        status: { in: RECONCILABLE_STATUSES },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: NfseReconcileTargetSelect,
      orderBy: { id: 'asc' },
    });

    return rows.map((row) => this.mapToReconcileTarget(row));
  }

  public async findIssuedWithoutBankPaymentJob(limit: number): Promise<NfseReconcileTargetDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: null,
        bankPaymentFailedAt: null,
      },
      select: NfseReconcileTargetSelect,
      orderBy: { id: 'asc' },
      take: limit,
    });

    return rows.map((row) => this.mapToReconcileTarget(row));
  }

  public async findBankPaymentUnconfirmed(olderThanMinutes: number, limit: number): Promise<NfseReconcileTargetDto[]> {
    const rows = await this.prisma.nfse.findMany({
      where: {
        bankPaymentRequestCode: { not: null },
        bankPaymentConfirmedAt: null,
        bankPaymentFailedAt: null,
        bankPaymentRequestedAt: { lt: NfseDaoAdapterPrisma.minutesAgo(olderThanMinutes) },
      },
      select: NfseReconcileTargetSelect,
      orderBy: { id: 'asc' },
      take: limit,
    });

    return rows.map((row) => this.mapToReconcileTarget(row));
  }

  private static minutesAgo(minutes: number): Date {
    return new Date(Date.now() - minutes * 60_000);
  }

  public async countByStatus(): Promise<NfseCountByKeyDto[]> {
    const rows = await this.prisma.nfse.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return rows.map((row) => ({ key: row.status, count: row._count._all }));
  }

  public async countByBankPaymentStatus(): Promise<NfseCountByKeyDto[]> {
    const rows = await this.prisma.nfse.groupBy({
      by: ['bankPaymentStatus'],
      where: { bankPaymentRequestCode: { not: null } },
      _count: { _all: true },
    });

    // `null` é situação: cobrança solicitada e ainda não confirmada pelo provedor.
    return rows.map((row) => ({ key: row.bankPaymentStatus ?? 'UNCONFIRMED', count: row._count._all }));
  }

  public async countStuck(olderThanMinutes: number): Promise<number> {
    return this.prisma.nfse.count({
      where: {
        status: { in: NON_TERMINAL_STATUSES },
        updatedAt: { lt: NfseDaoAdapterPrisma.minutesAgo(olderThanMinutes) },
      },
    });
  }

  public async countIssuedWithoutBankPayment(olderThanMinutes: number): Promise<number> {
    return this.prisma.nfse.count({
      where: {
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: null,
        issuedAt: { lt: NfseDaoAdapterPrisma.minutesAgo(olderThanMinutes) },
      },
    });
  }

  public async findProviderCallStats(sinceMinutes: number): Promise<NfseProviderCallStatsDto[]> {
    const since = NfseDaoAdapterPrisma.minutesAgo(sinceMinutes);

    const [grouped, errors] = await Promise.all([
      this.prisma.nfseAttempt.groupBy({
        by: ['operation'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _avg: { durationMs: true },
        _max: { durationMs: true },
      }),
      this.prisma.nfseAttempt.groupBy({
        by: ['operation'],
        where: { createdAt: { gte: since }, errorClass: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const errorsByOperation = new Map(errors.map((row) => [row.operation, row._count._all]));

    return grouped
      .map((row) => ({
        operation: row.operation,
        calls: row._count._all,
        errors: errorsByOperation.get(row.operation) ?? 0,
        averageDurationMs: row._avg.durationMs === null ? null : Math.round(row._avg.durationMs),
        maxDurationMs: row._max.durationMs,
      }))
      .sort((a, b) => b.calls - a.calls);
  }

  private mapToAlertRow(row: Prisma.NfseGetPayload<{ select: typeof NfseAlertRowSelect }>): NfseAlertRowDto {
    return { ...row, status: row.status as NfseStatus };
  }

  private mapToReconcileTarget(
    row: Prisma.NfseGetPayload<{ select: typeof NfseReconcileTargetSelect }>,
  ): NfseReconcileTargetDto {
    return { ...row, status: row.status as NfseStatus };
  }

  private mapToDto(row: Prisma.NfseGetPayload<{ select: typeof NfseSelect }>): NfseDto {
    return {
      ...row,
      status: row.status as NfseStatus,
      data: row.data as Record<string, unknown>,
    };
  }
}
