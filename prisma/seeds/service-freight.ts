import { Prisma, PrismaClient } from '@prisma/client';

export class ServiceFreightSeed {
  private static data: Prisma.ServiceFreightCreateInput[] = [
    { name: 'CIF', active: true },
    { name: 'FOB', active: true },
    { name: 'EXW', active: true },
    { name: 'DDP', active: true },
    { name: 'DAP', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const serviceFreight = await prisma.serviceFreight.findFirst();
    if (serviceFreight) {
      return;
    }

    for (const data of this.data) {
      await prisma.serviceFreight.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Service freights seeded');
  }
}
