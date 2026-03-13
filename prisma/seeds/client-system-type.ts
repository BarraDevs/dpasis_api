import { Prisma, PrismaClient } from '@prisma/client';

export class ClientSystemTypeSeed {
  private static data: Prisma.ClientSystemTypeCreateInput[] = [
    { name: 'ERP', active: true },
    { name: 'CRM', active: true },
    { name: 'Sistema de Gestão', active: true },
    { name: 'Contabilidade', active: true },
    { name: 'Folha de Pagamento', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientSystemType = await prisma.clientSystemType.findFirst();
    if (clientSystemType) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientSystemType.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Client system types seeded');
  }
}
