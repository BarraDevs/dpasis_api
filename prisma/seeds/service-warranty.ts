import { Prisma, PrismaClient } from '@prisma/client';

export class ServiceWarrantySeed {
  private static data: Prisma.ServiceWarrantyCreateInput[] = [
    { name: 'Sem garantia', active: true },
    { name: '90 dias', active: true },
    { name: '1 ano', active: true },
    { name: '2 anos', active: true },
    { name: '3 anos', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const serviceWarranty = await prisma.serviceWarranty.findFirst();
    if (serviceWarranty) {
      return;
    }

    for (const data of this.data) {
      await prisma.serviceWarranty.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Service warranties seeded');
  }
}
