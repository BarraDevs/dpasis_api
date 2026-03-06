import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAddressDaoAdapterPrisma } from './client-address-prisma.dao';

describe('ClientAddressDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientAddressDaoAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientAddressDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientAddressDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no client addresses exist', async() => {
      const [addresses, total] = await sut.findAll({ clientId });

      expect(addresses).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return client addresses saved in database with correct format', async() => {
      const created = await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Teste',
          number: '123',
          complement: 'Apto 101',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const [addresses, total] = await sut.findAll({ clientId });

      expect(addresses).toHaveLength(1);
      expect(total).toBe(1);
      expect(addresses[0]).toEqual({
        id: created.id,
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect(addresses[0].createdAt).toBeInstanceOf(Date);
      expect(addresses[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should paginate results correctly', async() => {
      const types = [
        ClientAddressType.MAIN,
        ClientAddressType.BILLING,
        ClientAddressType.SUPPORT,
        ClientAddressType.CORRESPONDENCE,
      ];
      await prisma.clientAddress.createMany({
        data: types.map((type, i) => ({
          clientId,
          type,
          zipCode: `12345-${String(i).padStart(3, '0')}`,
          street: `Rua ${i + 1}`,
          number: String(i + 1),
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        })),
      });

      const [page1, total] = await sut.findAll({ clientId, page: 1, size: 2 });
      const [page2] = await sut.findAll({ clientId, page: 2, size: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(total).toBe(4);
    });

    it('should return results ordered by id asc', async() => {
      const first = await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '11111-111',
          street: 'Rua Primeira',
          number: '1',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const second = await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.BILLING,
          zipCode: '22222-222',
          street: 'Rua Segunda',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const [addresses] = await sut.findAll({ clientId });

      expect(addresses[0].id).toBe(first.id);
      expect(addresses[0].street).toBe('Rua Primeira');
      expect(addresses[1].id).toBe(second.id);
      expect(addresses[1].street).toBe('Rua Segunda');
    });

    it('should search in address fields (case-insensitive)', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua das Flores',
          number: '100',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.BILLING,
          zipCode: '98765-432',
          street: 'Av. Principal',
          number: '200',
          complement: null,
          neighborhood: 'Jardins',
          city: 'Rio de Janeiro',
          state: 'RJ',
        },
      });

      const [addresses, total] = await sut.findAll({ clientId, search: 'Flores' });

      expect(addresses).toHaveLength(1);
      expect(total).toBe(1);
      expect(addresses[0].street).toBe('Rua das Flores');
    });

    it('should filter by type when provided', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Principal',
          number: '1',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.BILLING,
          zipCode: '12345-679',
          street: 'Rua Cobrança',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const [addressesMain, totalMain] = await sut.findAll({
        clientId,
        type: ClientAddressType.MAIN,
      });
      const [addressesBilling, totalBilling] = await sut.findAll({
        clientId,
        type: ClientAddressType.BILLING,
      });

      expect(addressesMain).toHaveLength(1);
      expect(totalMain).toBe(1);
      expect(addressesMain[0].type).toBe(ClientAddressType.MAIN);

      expect(addressesBilling).toHaveLength(1);
      expect(totalBilling).toBe(1);
      expect(addressesBilling[0].type).toBe(ClientAddressType.BILLING);
    });
  });

  describe('findById', () => {
    it('should return null when client address does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return client address by id with correct format', async() => {
      const created = await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Teste',
          number: '123',
          complement: 'Apto 101',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        id: created.id,
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should return client address with null complement', async() => {
      const created = await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.SUPPORT,
          zipCode: '98765-432',
          street: 'Av. Principal',
          number: '456',
          complement: null,
          neighborhood: 'Jardins',
          city: 'Rio de Janeiro',
          state: 'RJ',
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.complement).toBeNull();
      expect(result?.street).toBe('Av. Principal');
    });
  });

  describe('findByClientIdAndType', () => {
    it('should return null when no address exists for client and type', async() => {
      const result = await sut.findByClientIdAndType(clientId, ClientAddressType.MAIN);

      expect(result).toBeNull();
    });

    it('should return null when client has addresses but not of the requested type', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Principal',
          number: '1',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.findByClientIdAndType(clientId, ClientAddressType.BILLING);

      expect(result).toBeNull();
    });

    it('should return address when it exists for the given clientId and type', async() => {
      const created = await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Teste',
          number: '123',
          complement: 'Apto 101',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.findByClientIdAndType(clientId, ClientAddressType.MAIN);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        id: created.id,
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should return null when address exists for same type but different client', async() => {
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo Outro ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner Outro ${Date.now()}`, active: true } }),
      ]);

      const otherClient = await prisma.client.create({
        data: {
          type: ClientType.PJ,
          document: '11111111000111',
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Outra Empresa',
          fantasyName: null,
          headquarters: 'Rio de Janeiro',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      await prisma.clientAddress.create({
        data: {
          clientId: otherClient.id,
          type: ClientAddressType.MAIN,
          zipCode: '99999-999',
          street: 'Rua Outro Cliente',
          number: '999',
          complement: null,
          neighborhood: 'Centro',
          city: 'Rio de Janeiro',
          state: 'RJ',
        },
      });

      const result = await sut.findByClientIdAndType(clientId, ClientAddressType.MAIN);

      expect(result).toBeNull();
    });

    it('should return correct address when client has multiple addresses of different types', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '11111-111',
          street: 'Rua Principal',
          number: '1',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const billingAddress = await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.BILLING,
          zipCode: '22222-222',
          street: 'Rua Cobrança',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.findByClientIdAndType(clientId, ClientAddressType.BILLING);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(billingAddress.id);
      expect(result?.type).toBe(ClientAddressType.BILLING);
      expect(result?.street).toBe('Rua Cobrança');
    });
  });
});
