import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfmDao } from 'src/app/tax-invoice/nfm/application/persistence/dao/nfm-dao.interface';
import {
  EditNfmData,
  NfmPersistedRowDto,
  SaveNfmData,
} from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class NfmDaoAdapterPrisma implements INfmDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findByClientReferenceAndCnae(
    clientId: number,
    referenceMonth: number,
    referenceYear: number,
    cnaeNbsIndopId: number,
  ): Promise<NfmPersistedRowDto | null> {
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
      select: {
        id: true,
        nfseId: true,
        status: true,
      },
    });

    return row;
  }

  public async save(data: SaveNfmData): Promise<number> {
    const result = await this.prisma.nfm.create({
      data: {
        clientId: data.clientId,
        clientDocument: data.clientDocument,
        companyName: data.companyName,
        status: data.status,
        referenceMonth: data.referenceMonth,
        referenceYear: data.referenceYear,
        totalValueInCents: data.totalValueInCents,
        cnaeNbsIndopId: data.cnaeNbsIndopId,
        nfseId: data.nfseId ?? null,
        data: data.data as unknown as Prisma.InputJsonValue,
      },
    });

    return result.id;
  }

  public async edit(id: number, data: EditNfmData): Promise<void> {
    await this.prisma.nfm.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.nfseId !== undefined ? { nfseId: data.nfseId } : {}),
      },
    });
  }
}
