import { Prisma, PrismaClient } from '@prisma/client';

export class ServiceCategorySeed {
  private static data: Prisma.ServiceCategoryCreateInput[] = [
    { name: 'Manutenção', active: true },
    { name: 'Instalação', active: true },
    { name: 'Consultoria', active: true },
    { name: 'Suporte', active: true },
    { name: 'Treinamento', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const serviceCategory = await prisma.serviceCategory.findFirst();
    if (serviceCategory) {
      return;
    }

    for (const data of this.data) {
      await prisma.serviceCategory.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Service categories seeded');
  }
}
