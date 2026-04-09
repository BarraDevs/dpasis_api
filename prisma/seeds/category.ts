import { Prisma, PrismaClient } from '@prisma/client';

export class CategorySeed {
  private static data: Prisma.CategoryCreateManyInput[] = [
    { name: 'Manutenção', active: true },
    { name: 'Instalação', active: true },
    { name: 'Consultoria', active: true },
    { name: 'Suporte', active: true },
    { name: 'Treinamento', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const category = await prisma.category.findFirst();
    if (category) {
      return;
    }

    for (const data of this.data) {
      await prisma.category.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Category seeded');
  }
}
