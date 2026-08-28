import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import { Nfse } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
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
  data: true,
} satisfies Prisma.NfseSelect;

@Injectable()
export class NfseRepositoryAdapterPrisma implements INfseRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Nfse): Promise<number> {
    const props = entity.props;

    const row = await this.prisma.nfse.create({
      data: {
        companyId: props.companyId,
        clientId: props.clientId,
        rpsNumber: props.rpsNumber,
        rpsSeries: props.rpsSeries,
        status: props.status,
        data: props.data as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return row.id;
  }

  public async edit(entity: Nfse): Promise<void> {
    const props = entity.props;

    await this.prisma.nfse.update({
      where: { id: props.id },
      data: {
        status: props.status,
        batchProtocol: props.batchProtocol,
        nfseNumber: props.nfseNumber,
        verificationCode: props.verificationCode,
        issuedAt: props.issuedAt,
        errorMessage: props.errorMessage,
        canceledAt: props.canceledAt,
        cancelReasonCode: props.cancelReasonCode,
        bankPaymentProvider: props.bankPaymentProvider,
        bankPaymentRequestCode: props.bankPaymentRequestCode,
        data: props.data as unknown as Prisma.InputJsonValue,
      },
    });
  }

  public async findById(id: number): Promise<Nfse | null> {
    const row = await this.prisma.nfse.findUnique({
      where: { id },
      select: NfseSelect,
    });

    if (!row) {
      return null;
    }

    return NfseFactory.load({
      id: row.id,
      companyId: row.companyId,
      clientId: row.clientId,
      rpsNumber: row.rpsNumber,
      rpsSeries: row.rpsSeries,
      status: row.status as NfseStatus,
      batchProtocol: row.batchProtocol,
      nfseNumber: row.nfseNumber,
      verificationCode: row.verificationCode,
      issuedAt: row.issuedAt,
      errorMessage: row.errorMessage,
      canceledAt: row.canceledAt,
      cancelReasonCode: row.cancelReasonCode,
      bankPaymentProvider: row.bankPaymentProvider,
      bankPaymentRequestCode: row.bankPaymentRequestCode,
      data: row.data as Record<string, unknown>,
    });
  }
}
