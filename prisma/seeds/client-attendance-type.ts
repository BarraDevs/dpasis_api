import { Prisma, PrismaClient } from '@prisma/client';

export class ClientAttendanceTypeSeed {
  private static data: Prisma.ClientAttendanceTypeCreateInput[] = [
    { name: 'Presencial', active: true },
    { name: 'Remoto', active: true },
    { name: 'Híbrido', active: true },
    { name: 'Online', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientAttendanceType = await prisma.clientAttendanceType.findFirst();
    if (clientAttendanceType) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientAttendanceType.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Client attendance types seeded');
  }
}
