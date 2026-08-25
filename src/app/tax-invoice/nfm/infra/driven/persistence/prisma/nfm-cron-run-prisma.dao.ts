import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfmCronRunDao } from 'src/app/tax-invoice/nfm/application/persistence/dao/nfm-cron-run-dao.interface';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class NfmCronRunDaoAdapterPrisma implements INfmCronRunDao {
  constructor(private readonly prisma: PrismaService) {}

  public async save(data: SaveElegibleNfmsOutputDto): Promise<number> {
    const result = await this.prisma.nfmCronRun.create({
      data: {
        createdCount: data.created,
        skippedCount: data.skipped,
        failedCount: data.failed,
        errors: data.errors as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return result.id;
  }
}
