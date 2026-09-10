import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfmRepository } from 'src/app/tax-invoice/nfm/application/persistence/repository/nfm-repository.interface';
import { Nfm } from 'src/app/tax-invoice/nfm/domain/entities/nfm.entity';
import { NfmFactory } from 'src/app/tax-invoice/nfm/domain/factories/nfm.factory';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
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
  bankPaymentRetryCount: true,
  bankPaymentNextRetryAt: true,
  reconcileAttemptCount: true,
  nextReconcileAt: true,
  nfmId: true,
  data: true,
  createdAt: true,
} satisfies Prisma.NfseSelect;

const NfmSelect = {
  id: true,
  clientId: true,
  clientDocument: true,
  companyName: true,
  referenceMonth: true,
  referenceYear: true,
  totalValueInCents: true,
  cnaeNbsIndopId: true,
  data: true,
  nfse: { select: NfseSelect },
} satisfies Prisma.NfmSelect;

type NfmRow = Prisma.NfmGetPayload<{ select: typeof NfmSelect }>;

@Injectable()
export class NfmRepositoryAdapterPrisma implements INfmRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Nfm): Promise<number> {
    const props = entity.props;

    const row = await this.prisma.nfm.create({
      data: {
        clientId: props.clientId,
        clientDocument: props.clientDocument,
        companyName: props.companyName,
        referenceMonth: props.referenceMonth,
        referenceYear: props.referenceYear,
        totalValueInCents: props.totalValueInCents,
        cnaeNbsIndopId: props.cnaeNbsIndopId,
        nfseId: props.nfse?.props.id ?? null,
        data: props.data as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return row.id;
  }

  public async edit(entity: Nfm): Promise<void> {
    const props = entity.props;

    await this.prisma.nfm.update({
      where: { id: props.id },
      data: {
        nfseId: props.nfse?.props.id ?? null,
      },
    });
  }

  public async findById(id: number): Promise<Nfm | null> {
    const row = await this.prisma.nfm.findUnique({
      where: { id },
      select: NfmSelect,
    });

    if (!row) {
      return null;
    }

    return this.toEntity(row);
  }

  public async findByClientReferenceAndCnae(
    clientId: number,
    referenceMonth: number,
    referenceYear: number,
    cnaeNbsIndopId: number,
  ): Promise<Nfm | null> {
    const row = await this.prisma.nfm.findUnique({
      where: {
        // Prisma compound unique name (not camelCase by design)
        // eslint-disable-next-line camelcase
        clientId_referenceMonth_referenceYear_cnaeNbsIndopId: {
          clientId,
          referenceMonth,
          referenceYear,
          cnaeNbsIndopId,
        },
      },
      select: NfmSelect,
    });

    if (!row) {
      return null;
    }

    return this.toEntity(row);
  }

  private toEntity(row: NfmRow): Nfm {
    const nfse = row.nfse
      ? NfseFactory.load({
        id: row.nfse.id,
        companyId: row.nfse.companyId,
        clientId: row.nfse.clientId,
        rpsNumber: row.nfse.rpsNumber,
        rpsSeries: row.nfse.rpsSeries,
        status: row.nfse.status as NfseStatus,
        batchProtocol: row.nfse.batchProtocol,
        nfseNumber: row.nfse.nfseNumber,
        verificationCode: row.nfse.verificationCode,
        issuedAt: row.nfse.issuedAt,
        errorMessage: row.nfse.errorMessage,
        canceledAt: row.nfse.canceledAt,
        cancelReasonCode: row.nfse.cancelReasonCode,
        bankPaymentProvider: row.nfse.bankPaymentProvider,
        bankPaymentRequestCode: row.nfse.bankPaymentRequestCode,
        bankPaymentIdempotencyKey: row.nfse.bankPaymentIdempotencyKey,
        bankPaymentRequestedAt: row.nfse.bankPaymentRequestedAt,
        bankPaymentErrorMessage: row.nfse.bankPaymentErrorMessage,
        bankPaymentFailedAt: row.nfse.bankPaymentFailedAt,
        bankPaymentStatus: row.nfse.bankPaymentStatus,
        bankPaymentConfirmedAt: row.nfse.bankPaymentConfirmedAt,
        bankPaymentRetryCount: row.nfse.bankPaymentRetryCount,
        bankPaymentNextRetryAt: row.nfse.bankPaymentNextRetryAt,
        reconcileAttemptCount: row.nfse.reconcileAttemptCount,
        nextReconcileAt: row.nfse.nextReconcileAt,
        nfmId: row.nfse.nfmId,
        createdAt: row.nfse.createdAt,
        data: row.nfse.data as Record<string, unknown>,
      })
      : null;

    return NfmFactory.load({
      id: row.id,
      clientId: row.clientId,
      clientDocument: row.clientDocument,
      companyName: row.companyName,
      referenceMonth: row.referenceMonth,
      referenceYear: row.referenceYear,
      totalValueInCents: row.totalValueInCents,
      cnaeNbsIndopId: row.cnaeNbsIndopId,
      data: row.data as Record<string, unknown>,
      nfse,
    });
  }
}
