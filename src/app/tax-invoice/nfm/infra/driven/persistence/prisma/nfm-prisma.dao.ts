import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfmDao } from 'src/app/tax-invoice/nfm/application/persistence/dao/nfm-dao.interface';
import { SaveNfmData } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class NfmDaoAdapterPrisma implements INfmDao {
  constructor(private readonly prisma: PrismaService) {}

  public async saveMany(rows: SaveNfmData[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }

    const data: Prisma.NfmCreateManyInput[] = rows.map(row => ({
      clientId: row.clientId,
      clientDocument: row.clientDocument,
      companyName: row.companyName,
      status: row.status,
      referenceMonth: row.referenceMonth,
      referenceYear: row.referenceYear,
      totalValueInCents: row.totalValueInCents,
      data: row.data as unknown as Prisma.InputJsonValue,
    }));

    const result = await this.prisma.nfm.createMany({
      data,
      skipDuplicates: true,
    });

    return result.count;
  }
}
