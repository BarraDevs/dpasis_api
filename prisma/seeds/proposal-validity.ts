import { Prisma, PrismaClient } from '@prisma/client';

export class ProposalValiditySeed {
  private static data: Prisma.ProposalValidityCreateInput[] = [
    { name: '7 dias', active: true },
    { name: '15 dias', active: true },
    { name: '30 dias', active: true },
    { name: '60 dias', active: true },
    { name: '90 dias', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const proposalValidity = await prisma.proposalValidity.findFirst();
    if (proposalValidity) {
      return;
    }

    for (const data of this.data) {
      await prisma.proposalValidity.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      });
    }

    console.log('Proposal validity seeded');
  }
}
