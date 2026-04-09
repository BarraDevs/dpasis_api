import { Prisma, PrismaClient } from '@prisma/client';

export class WarrantySeed {
  private static data: Prisma.WarrantyCreateInput[] = [
    { name: 'Sem garantia', active: true },
    { name: '90 dias', active: true },
    { name: '1 ano', active: true },
    { name: '2 anos', active: true },
    { name: '3 anos', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const warranty = await prisma.warranty.findFirst();
    if (warranty) {
      return;
    }

    for (const data of this.data) {
      await prisma.warranty.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Warranty seeded');
  }
}
