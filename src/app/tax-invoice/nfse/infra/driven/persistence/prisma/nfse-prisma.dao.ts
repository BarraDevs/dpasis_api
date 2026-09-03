import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import { NfseAlertRowDto, NfseDailyClosingDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-alert-row.dto';
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
} satisfies Prisma.NfseSelect;

const NON_TERMINAL_STATUSES = [
  NfseStatus.PENDING,
  NfseStatus.SUBMITTED,
  NfseStatus.PROCESSING,
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

  private static minutesAgo(minutes: number): Date {
    return new Date(Date.now() - minutes * 60_000);
  }

  private mapToAlertRow(row: Prisma.NfseGetPayload<{ select: typeof NfseAlertRowSelect }>): NfseAlertRowDto {
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
