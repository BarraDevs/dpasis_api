import { Prisma, PrismaClient } from '@prisma/client';

export class BankSeed {
  private static data: Prisma.BankCreateInput[] = [
    {
      drawer: 'Titular Principal',
      wallet: 'Corrente',
      account: '12345-6',
      agency: '0001',
      bankCode: '001',
      bankName: 'Banco do Brasil',
      paymentLocation: 'Pagável em qualquer banco até o vencimento',
      active: true,
    },
    {
      drawer: 'Titular Principal',
      wallet: 'Corrente',
      account: '98765-4',
      agency: '1234',
      bankCode: '341',
      bankName: 'Banco Itaú Unibanco',
      paymentLocation: 'Pagável em qualquer banco até o vencimento',
      active: true,
    },
    {
      drawer: 'Titular Principal',
      wallet: 'Corrente',
      account: '54321-0',
      agency: '0567',
      bankCode: '104',
      bankName: 'Caixa Econômica Federal',
      paymentLocation: 'Pagável em qualquer banco até o vencimento',
      active: true,
    },
    {
      drawer: 'Titular Principal',
      wallet: 'Corrente',
      account: '11111-1',
      agency: '0001',
      bankCode: '237',
      bankName: 'Banco Bradesco',
      active: true,
    },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    for (const data of this.data) {
      await prisma.bank.create({
        data,
      });
    }

    console.log('Banks seeded');
  }
}
