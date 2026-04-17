import { Prisma, PrismaClient } from '@prisma/client';

export class ClientAttendanceSeed {
  private static data: Prisma.ClientAttendanceCreateInput[] = [
    { name: 'Presencial', active: true },
    { name: 'Remoto', active: true },
    { name: 'Híbrido', active: true },
    { name: 'Online', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientAttendance = await prisma.clientAttendance.findFirst();
    if (clientAttendance) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientAttendance.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Client attendance seeded');
  }
}
