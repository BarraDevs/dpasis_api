import { Prisma, PrismaClient } from '@prisma/client';

export class ClientMaintenanceTicketTypeSeed {
  private static data: Prisma.ClientMaintenanceTicketTypeCreateInput[] = [
    { name: 'Corretiva', active: true },
    { name: 'Preventiva', active: true },
    { name: 'Preditiva', active: true },
    { name: 'Emergencial', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.findFirst();
    if (clientMaintenanceTicketType) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientMaintenanceTicketType.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Client maintenance ticket types seeded');
  }
}
