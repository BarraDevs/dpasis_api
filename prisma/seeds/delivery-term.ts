import { Prisma, PrismaClient } from '@prisma/client';

export class DeliveryTermSeed {
  private static data: Prisma.DeliveryTermCreateInput[] = [
    { name: 'Imediato', active: true },
    { name: '7 dias', active: true },
    { name: '15 dias', active: true },
    { name: '30 dias', active: true },
    { name: '45 dias', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const deliveryTerm = await prisma.deliveryTerm.findFirst();
    if (deliveryTerm) {
      return;
    }

    for (const data of this.data) {
      await prisma.deliveryTerm.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Delivery term seeded');
  }
}
