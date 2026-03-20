import { Prisma, PrismaClient } from '@prisma/client';

export class ServiceProposalValiditySeed {
  private static data: Prisma.ServiceProposalValidityCreateInput[] = [
    { name: '7 dias', active: true },
    { name: '15 dias', active: true },
    { name: '30 dias', active: true },
    { name: '60 dias', active: true },
    { name: '90 dias', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const serviceProposalValidity = await prisma.serviceProposalValidity.findFirst();
    if (serviceProposalValidity) {
      return;
    }

    for (const data of this.data) {
      await prisma.serviceProposalValidity.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Service proposal validities seeded');
  }
}
