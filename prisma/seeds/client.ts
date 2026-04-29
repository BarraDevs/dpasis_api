import { Prisma, PrismaClient } from '@prisma/client';
import { ClientInvoiceType } from '../../src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from '../../src/app/client/client/domain/enums/client-type.enum';

export class ClientSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const client = await prisma.client.findFirst();
    if (client) {
      return;
    }

    const [firstGroup, firstResale] = await Promise.all([
      prisma.clientGroup.findFirst({ select: { id: true } }),
      prisma.resale.findFirst({ select: { id: true } }),
    ]);

    if (!firstGroup || !firstResale) {
      console.log('Client: Skipping - ClientGroup or Resale not seeded');
      return;
    }

    const data: Prisma.ClientCreateInput[] = [
      {
        id: 1,
        type: ClientType.PJ,
        document: '12.345.678/0001-91',
        ie: '123.456.789.001',
        group: { connect: { id: firstGroup.id } },
        resale: { connect: { id: firstResale.id } },
        companyName: 'Cliente Exemplo Ltda',
        fantasyName: 'Cliente Exemplo',
        headquarters: 'Matriz',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
      {
        id: 2,
        type: ClientType.PJ,
        document: '98.765.432/0001-11',
        group: { connect: { id: firstGroup.id } },
        resale: { connect: { id: firstResale.id } },
        companyName: 'Tech Cliente S.A.',
        fantasyName: 'TechCliente',
        headquarters: 'Matriz',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: true,
        active: true,
      },
      {
        id: 3,
        type: ClientType.PF,
        document: '123.456.789-00',
        group: { connect: { id: firstGroup.id } },
        resale: { connect: { id: firstResale.id } },
        companyName: 'João da Silva',
        headquarters: 'Único',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: false,
        active: true,
      },
    ];

    for (const item of data) {
      await prisma.client.create({
        data: item,
      });
    }

    console.log('Clients seeded');
  }
}
