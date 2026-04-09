import { Prisma, PrismaClient } from '@prisma/client';

export class FreightSeed {
  private static data: Prisma.FreightCreateInput[] = [
    { name: 'CIF', active: true },
    { name: 'FOB', active: true },
    { name: 'EXW', active: true },
    { name: 'DDP', active: true },
    { name: 'DAP', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const freight = await prisma.freight.findFirst();
    if (freight) {
      return;
    }

    for (const data of this.data) {
      await prisma.freight.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Freight seeded');
  }
}
