import { Injectable } from '@nestjs/common';
import { INfseRpsSequenceRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-rps-sequence-repository.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class NfseRpsSequenceRepositoryAdapterPrisma implements INfseRpsSequenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async getAndIncrement(companyId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ next_id: bigint }]>`
      INSERT INTO nfse_rps_sequences (company_id, next_id, updated_at)
      VALUES (${companyId}, 2, NOW())
      ON CONFLICT (company_id)
      DO UPDATE SET next_id = nfse_rps_sequences.next_id + 1, updated_at = NOW()
      RETURNING next_id - 1 AS next_id
    `;

    return Number(result[0].next_id);
  }
}
