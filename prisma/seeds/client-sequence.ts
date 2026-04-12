import { PrismaClient } from '@prisma/client';

export class ClientSequenceSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const agg = await prisma.client.aggregate({ _max: { id: true } });
    const maxId = agg._max.id ?? 0;
    await prisma.clientSequence.upsert({
      where: { id: 1 },
      create: { id: 1, nextId: maxId + 1 },
      update: { nextId: maxId + 1 },
    });
    console.log(`ClientSequence seeded: nextId = ${maxId + 1}`);
  }
}
