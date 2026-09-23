import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NfseClassificationDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-classification.dto';
import { normalizeRpsSeries } from 'src/app/tax-invoice/nfse/application/helpers/normalize-rps-series';
import {
  INfseClassificationDao,
  NfseClassificationRpsKey,
  NfseClassificationUpsertItem,
} from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-classification-dao.interface';
import { NfseClassificationKind } from 'src/app/tax-invoice/nfse/domain/enums/nfse-classification-kind.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const NfseClassificationSelect = {
  id: true,
  companyId: true,
  rpsNumber: true,
  rpsSeries: true,
  kind: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NfseClassificationSelect;

function mapToDto(row: {
  id: number;
  companyId: number;
  rpsNumber: number;
  rpsSeries: string;
  kind: string;
  createdAt: Date;
  updatedAt: Date;
}): NfseClassificationDto {
  return {
    ...row,
    kind: row.kind as NfseClassificationKind,
  };
}

@Injectable()
export class NfseClassificationDaoAdapterPrisma implements INfseClassificationDao {
  constructor(private readonly prisma: PrismaService) {}

  public async upsertMany(companyId: number, items: NfseClassificationUpsertItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.prisma.$transaction(async(tx) => {
      for (const item of items) {
        const rpsSeries = normalizeRpsSeries(item.rpsSeries);
        await tx.nfseClassification.upsert({
          where: {
            // Prisma compound unique name (not camelCase by design)
            // eslint-disable-next-line camelcase
            companyId_rpsSeries_rpsNumber: {
              companyId,
              rpsSeries,
              rpsNumber: item.rpsNumber,
            },
          },
          create: {
            companyId,
            rpsNumber: item.rpsNumber,
            rpsSeries,
            kind: item.kind,
          },
          update: {
            kind: item.kind,
          },
        });
      }
    });
  }

  public async findByRpsKeys(companyId: number, keys: NfseClassificationRpsKey[]): Promise<NfseClassificationDto[]> {
    if (keys.length === 0) {
      return [];
    }

    const conditions: Prisma.NfseClassificationWhereInput[] = keys.map((key) => ({
      rpsNumber: { equals: key.rpsNumber },
      rpsSeries: { equals: normalizeRpsSeries(key.rpsSeries) },
    }));

    const rows = await this.prisma.nfseClassification.findMany({
      where: {
        AND: [
          { companyId: { equals: companyId } },
          { OR: conditions },
        ],
      },
      select: NfseClassificationSelect,
    });

    return rows.map(mapToDto);
  }
}
