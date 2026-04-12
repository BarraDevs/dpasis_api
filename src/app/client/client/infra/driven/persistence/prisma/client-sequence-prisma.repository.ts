import { Injectable } from '@nestjs/common';
import { IClientSequenceRepository } from 'src/app/client/client/application/persistence/repository/client-sequence-repository.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientSequenceRepositoryAdapterPrisma implements IClientSequenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async getCurrent(): Promise<number> {
    const row = await this.prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
    return row.nextId;
  }

  public async getAndIncrement(): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ next_id: bigint }]>`
      UPDATE client_sequences
      SET next_id = next_id + 1, updated_at = NOW()
      WHERE id = 1
      RETURNING next_id - 1 AS next_id
    `;
    return Number(result[0].next_id);
  }

  public async setNextId(value: number): Promise<void> {
    await this.prisma.clientSequence.update({
      where: { id: 1 },
      data: { nextId: value },
    });
  }

  public async ensureNextIdIsAtLeast(minValue: number): Promise<void> {
    await this.prisma.clientSequence.updateMany({
      where: { id: 1, nextId: { lt: minValue } },
      data: { nextId: minValue },
    });
  }
}
