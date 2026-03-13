import { Prisma, PrismaClient } from '@prisma/client';

export class ClientDriveTypeSeed {
  private static data: Prisma.ClientDriveTypeCreateInput[] = [
    { name: 'Google Drive', active: true },
    { name: 'OneDrive', active: true },
    { name: 'Dropbox', active: true },
    { name: 'SharePoint', active: true },
    { name: 'iCloud', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientDriveType = await prisma.clientDriveType.findFirst();
    if (clientDriveType) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientDriveType.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Client drive types seeded');
  }
}
