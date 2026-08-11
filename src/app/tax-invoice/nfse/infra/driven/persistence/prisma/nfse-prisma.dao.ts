import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
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
  data: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NfseSelect;

@Injectable()
export class NfseDaoAdapterPrisma implements INfseDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: number): Promise<NfseDto | null> {
    const row = await this.prisma.nfse.findUnique({ where: { id }, select: NfseSelect });
    return row ? this.mapToDto(row) : null;
  }

  private mapToDto(row: Prisma.NfseGetPayload<{ select: typeof NfseSelect }>): NfseDto {
    return {
      ...row,
      status: row.status as NfseStatus,
      data: row.data as Record<string, unknown>,
    };
  }
}
