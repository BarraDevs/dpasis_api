import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NfseOutboxRowDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-outbox-row.dto';
import { INfseOutboxDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-outbox-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const NfseOutboxSelect = {
  id: true,
  nfseId: true,
  jobName: true,
  payload: true,
} satisfies Prisma.NfseOutboxSelect;

@Injectable()
export class NfseOutboxDaoAdapterPrisma implements INfseOutboxDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findUndispatched(olderThanSeconds: number, limit: number): Promise<NfseOutboxRowDto[]> {
    const rows = await this.prisma.nfseOutbox.findMany({
      where: {
        dispatchedAt: null,
        availableAt: { lte: new Date(Date.now() - olderThanSeconds * 1000) },
      },
      select: NfseOutboxSelect,
      orderBy: { availableAt: 'asc' },
      take: limit,
    });

    return rows.map((row) => ({
      id: row.id,
      nfseId: row.nfseId,
      jobName: row.jobName,
      payload: (row.payload ?? {}) as Record<string, unknown>,
    }));
  }
}
