import { Prisma, PrismaClient } from '@prisma/client';

export class ServiceBilledSeed {
  private static data: Prisma.ServiceBilledCreateManyInput[] = [
    {
      description: 'Fatura única à vista',
      isJunction: false,
      installmentDays: [0],
      active: true,
    },
    {
      description: 'Parcelamento em 30 dias',
      isJunction: false,
      installmentDays: [30],
      active: true,
    },
    {
      description: 'Parcelamento 30/60/90 dias',
      isJunction: false,
      installmentDays: [30, 60, 90],
      active: true,
    },
    {
      description: 'Junção de faturas (rateio)',
      isJunction: true,
      installmentDays: [15, 30],
      active: true,
    },
    {
      description: 'Antecipado (10 dias)',
      isJunction: false,
      installmentDays: [10],
      active: true,
    },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.serviceBilled.findFirst();
    if (existing) {
      return;
    }

    await prisma.serviceBilled.createMany({
      data: this.data,
    });

    console.log('Service billed seeded');
  }
}
