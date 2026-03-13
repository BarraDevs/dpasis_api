import { Prisma, PrismaClient } from '@prisma/client';

export class ClientOwnerSeed {
  private static data: Prisma.ClientOwnerCreateInput[] = Array.from({ length: 15 }, (_, index) => ({
    name: `Proprietário ${index + 1}`,
    active: true,
  }));

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientOwner = await prisma.clientOwner.findFirst();
    if (clientOwner) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientOwner.create({
        data,
      });
    }

    console.log('Client owners seeded');
  }
}
