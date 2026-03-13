import { Prisma, PrismaClient } from '@prisma/client';

export class ClientDescriptionTypeSeed {
  private static data: Prisma.ClientDescriptionTypeCreateInput[] = [
    { name: 'Standard', active: true },
    { name: 'Premium', active: true },
    { name: 'Enterprise', active: true },
    { name: 'Básico', active: true },
    { name: 'Completo', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientDescriptionType = await prisma.clientDescriptionType.findFirst();
    if (clientDescriptionType) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientDescriptionType.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Client description types seeded');
  }
}
