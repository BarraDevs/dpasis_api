import { Prisma, PrismaClient } from '@prisma/client';

export class ClientGroupSeed {
  private static data: Prisma.ClientGroupCreateInput[] = Array.from({ length: 15 }, (_, index) => ({
    name: `Grupo ${index + 1}`,
    active: true,
  }));

  static async seed(prisma: PrismaClient): Promise<void> {
    for (const data of this.data) {
      await prisma.clientGroup.create({
        data,
      });
    }

    console.log('Client groups seeded');
  }
}
