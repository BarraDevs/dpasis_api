import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NfmDaoRowDto, NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { INfmDao } from 'src/app/tax-invoice/nfm/application/persistence/dao/nfm-dao.interface';
import { FindGeneratedNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/dtos/find-generated-nfms.dto';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

/** Estados dos quais a nota não sai sozinha: nenhum deles é "preso". */
const TERMINAL_NFSE_STATUSES = [
  NfseStatus.ISSUED,
  NfseStatus.REJECTED,
  NfseStatus.FAILED,
  NfseStatus.CANCELED,
] satisfies NfseStatus[];

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
  bankPaymentSettledAt: true,
  bankPaymentNextSettlementAt: true,
  bankPaymentRetryCount: true,
  bankPaymentNextRetryAt: true,
  reconcileAttemptCount: true,
  nextReconcileAt: true,
  nfmId: true,
  data: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NfseSelect;

const NfmWithNfseSelect = {
  id: true,
  clientId: true,
  clientDocument: true,
  companyName: true,
  referenceMonth: true,
  referenceYear: true,
  totalValueInCents: true,
  cnaeNbsIndopId: true,
  createdAt: true,
  updatedAt: true,
  nfse: { select: NfseSelect },
} satisfies Prisma.NfmSelect;

@Injectable()
export class NfmDaoAdapterPrisma implements INfmDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindGeneratedNfmsQueryDto): Promise<[NfmWithNfseDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    // `nfse: { isNot: null }` em vez de só `nfseId: { not: null }`: o filtro por campos da NFS-e
    // precisa do join, e sem ele a contagem incluía linhas que a página descartava depois.
    const conditions: Prisma.NfmWhereInput[] = [
      { nfseId: { not: null }, nfse: { isNot: null } },
    ];

    if (queries.dateStart) {
      conditions.push({
        createdAt: { gte: new Date(`${queries.dateStart}T00:00:00.000-03:00`) },
      });
    }

    if (queries.dateEnd) {
      conditions.push({
        createdAt: { lte: new Date(`${queries.dateEnd}T23:59:59.999-03:00`) },
      });
    }

    if (queries.status) {
      conditions.push({ nfse: { status: queries.status } });
    }

    if (queries.stuckForHours != null) {
      // Presa = não terminal e sem movimento. É a consulta que hoje só existe como SQL manual.
      conditions.push({
        nfse: {
          status: { notIn: TERMINAL_NFSE_STATUSES },
          updatedAt: { lte: new Date(Date.now() - queries.stuckForHours * ONE_HOUR_IN_MS) },
        },
      });
    }

    if (queries.missingBankPayment != null) {
      conditions.push({
        nfse: queries.missingBankPayment
          ? { status: NfseStatus.ISSUED, bankPaymentRequestCode: null }
          : { bankPaymentRequestCode: { not: null } },
      });
    }

    const where: Prisma.NfmWhereInput = { AND: conditions };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.nfm.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: NfmWithNfseSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.nfm.count({ where }),
    ]);

    // O `where` já exige a NFS-e, então o filtro aqui só satisfaz o tipo — nenhuma linha cai fora
    // dele, e por isso `total` e a página passam a contar a mesma coisa.
    const mapped = rows
      .map((row) => this.mapToRow(row))
      .filter((row): row is NfmWithNfseDto => row.nfse !== null);

    return [mapped, total];
  }

  public async findById(id: number): Promise<NfmDaoRowDto | null> {
    const row = await this.prisma.nfm.findUnique({
      where: { id },
      select: NfmWithNfseSelect,
    });

    if (!row) {
      return null;
    }

    return this.mapToRow(row);
  }

  private mapToRow(row: Prisma.NfmGetPayload<{ select: typeof NfmWithNfseSelect }>): NfmDaoRowDto {
    return {
      id: row.id,
      clientId: row.clientId,
      clientDocument: row.clientDocument,
      companyName: row.companyName,
      referenceMonth: row.referenceMonth,
      referenceYear: row.referenceYear,
      totalValueInCents: row.totalValueInCents,
      cnaeNbsIndopId: row.cnaeNbsIndopId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      nfse: row.nfse
        ? {
          ...row.nfse,
          status: row.nfse.status as NfseStatus,
          data: row.nfse.data as Record<string, unknown>,
        }
        : null,
    };
  }
}
