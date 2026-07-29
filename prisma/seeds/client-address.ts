import { PrismaClient } from '@prisma/client';
import { ClientAddressType } from '../../src/app/client/client-address/domain/enums/client-address-type.enum';

export class ClientAddressSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const clientAddress = await prisma.clientAddress.findFirst();
    if (clientAddress) {
      return;
    }

    const clients = await prisma.client.findMany({ select: { id: true, document: true } });

    if (clients.length === 0) {
      console.log('ClientAddress: Skipping - no clients seeded');
      return;
    }

    const addressData = [
      { type: ClientAddressType.BILLING, zipCode: '01310-100', street: 'Avenida Paulista', number: '500', complement: 'Sala 301', neighborhood: 'Bela Vista', city: 'São Paulo', cityCodeIbge: '3550308', state: 'SP' },
      { type: ClientAddressType.CORRESPONDENCE, zipCode: '01310-100', street: 'Avenida Paulista', number: '500', complement: 'Sala 301', neighborhood: 'Bela Vista', city: 'São Paulo', cityCodeIbge: '3550308', state: 'SP' },
      { type: ClientAddressType.MAIN, zipCode: '04543-907', street: 'Av. Eng. Luís Carlos Berrini', number: '1000', neighborhood: 'Itaim Bibi', city: 'São Paulo', cityCodeIbge: '3550308', state: 'SP' },
      { type: ClientAddressType.SUPPORT, zipCode: '30130-100', street: 'Av. Afonso Pena', number: '200', neighborhood: 'Centro', city: 'Belo Horizonte', cityCodeIbge: '3106200', state: 'MG' },
    ];

    for (let i = 0; i < Math.min(clients.length, addressData.length); i++) {
      const client = clients[i];
      const addr = addressData[i];
      await prisma.clientAddress.upsert({
        where: {
          // eslint-disable-next-line camelcase
          clientId_type: {
            clientId: client.id,
            type: addr.type,
          },
        },
        create: {
          ...addr,
          clientId: client.id,
          active: true,
        },
        update: {},
      });
    }

    console.log('Client addresses seeded');
  }
}
