import { Prisma, PrismaClient } from '@prisma/client';
import { ClientInvoiceType } from '../../src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from '../../src/app/client/client/domain/enums/client-type.enum';

export class ClientSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const client = await prisma.client.findFirst();
    if (client) {
      return;
    }

    const [firstGroup, firstOwner] = await Promise.all([
      prisma.clientGroup.findFirst({ select: { id: true } }),
      prisma.clientOwner.findFirst({ select: { id: true } }),
    ]);

    if (!firstGroup || !firstOwner) {
      console.log('Client: Skipping - ClientGroup or ClientOwner not seeded');
      return;
    }

    const data: Prisma.ClientCreateInput[] = [
      {
        type: ClientType.PJ,
        document: '12.345.678/0001-91',
        ie: '123.456.789.001',
        group: { connect: { id: firstGroup.id } },
        owner: { connect: { id: firstOwner.id } },
        companyName: 'Cliente Exemplo Ltda',
        fantasyName: 'Cliente Exemplo',
        headquarters: 'Matriz',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
      {
        type: ClientType.PJ,
        document: '98.765.432/0001-11',
        group: { connect: { id: firstGroup.id } },
        owner: { connect: { id: firstOwner.id } },
        companyName: 'Tech Cliente S.A.',
        fantasyName: 'TechCliente',
        headquarters: 'Matriz',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: true,
        active: true,
      },
      {
        type: ClientType.PF,
        document: '123.456.789-00',
        group: { connect: { id: firstGroup.id } },
        owner: { connect: { id: firstOwner.id } },
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
