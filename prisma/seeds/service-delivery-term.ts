import { Prisma, PrismaClient } from '@prisma/client';

export class ServiceDeliveryTermSeed {
  private static data: Prisma.ServiceDeliveryTermCreateInput[] = [
    { name: 'Imediato', active: true },
    { name: '7 dias', active: true },
    { name: '15 dias', active: true },
    { name: '30 dias', active: true },
    { name: '45 dias', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.findFirst();
    if (serviceDeliveryTerm) {
      return;
    }

    for (const data of this.data) {
      await prisma.serviceDeliveryTerm.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Service delivery terms seeded');
  }
}
