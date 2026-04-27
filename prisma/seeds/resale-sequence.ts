import { PrismaClient } from '@prisma/client';

export class ResaleSequenceSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const agg = await prisma.resale.aggregate({ _max: { id: true } });
    const maxId = agg._max.id ?? 0;
    await prisma.resaleSequence.upsert({
      where: { id: 1 },
      create: { id: 1, nextId: maxId + 1 },
      update: { nextId: maxId + 1 },
    });
    console.log(`ResaleSequence seeded: nextId = ${maxId + 1}`);
  }
}
