import { Prisma, PrismaClient } from '@prisma/client';

export class ClientMaintenanceTicketSeed {
  private static data: Prisma.ClientMaintenanceTicketCreateInput[] = [
    { name: 'Corretiva', active: true },
    { name: 'Preventiva', active: true },
    { name: 'Preditiva', active: true },
    { name: 'Emergencial', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.findFirst();
    if (clientMaintenanceTicket) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientMaintenanceTicket.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Client maintenance tickets seeded');
  }
}
