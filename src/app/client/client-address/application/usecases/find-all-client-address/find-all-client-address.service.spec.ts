import { Test } from '@nestjs/testing';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindAllClientAddress } from './find-all-client-address.service';

describe('FindAllClientAddress', () => {
  let sut: FindAllClientAddress;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAddressModule],
    }).compile();

    sut = module.get(FindAllClientAddress);
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

  it('should return empty pagination when no addresses exist', async() => {
    const result = await sut.execute({ clientId });

    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('should return paginated addresses when they exist', async() => {
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

    const result = await sut.execute({ clientId });

    expect(result.currentPage).toBe(1);
    expect(result.totalItems).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
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

  it('should return correct pagination structure with page and size', async() => {
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

    const result = await sut.execute({ clientId, page: 1, size: 2 });

    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalItems).toBe(4);
    expect(result.totalPages).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should filter by type when provided', async() => {
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

    await prisma.clientAddress.create({
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

    const result = await sut.execute({ clientId, type: ClientAddressType.MAIN });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].type).toBe(ClientAddressType.MAIN);
    expect(result.data[0].street).toBe('Rua Principal');
  });

  it('should return only addresses for the given clientId', async() => {
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
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Meu Cliente',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
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

    const result = await sut.execute({ clientId });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].street).toBe('Rua Meu Cliente');
  });

  describe('pagination', () => {
    it('should return second page with correct items', async() => {
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

      const result = await sut.execute({ clientId, page: 2, size: 2 });

      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalItems).toBe(4);
      expect(result.totalPages).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].street).toBe('Rua 3');
      expect(result.data[1].street).toBe('Rua 4');
    });

    it('should return last page with partial results when total is not divisible by size', async() => {
      const types = [
        ClientAddressType.MAIN,
        ClientAddressType.BILLING,
        ClientAddressType.SUPPORT,
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

      const page1 = await sut.execute({ clientId, page: 1, size: 2 });
      const page2 = await sut.execute({ clientId, page: 2, size: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page1.totalPages).toBe(2);
      expect(page2.data).toHaveLength(1);
      expect(page2.data[0].street).toBe('Rua 3');
    });

    it('should calculate totalPages correctly for various sizes', async() => {
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

      const size1 = await sut.execute({ clientId, page: 1, size: 1 });
      const size4 = await sut.execute({ clientId, page: 1, size: 4 });

      expect(size1.totalPages).toBe(4);
      expect(size1.data).toHaveLength(1);
      expect(size4.totalPages).toBe(1);
      expect(size4.data).toHaveLength(4);
    });

    it('should return results ordered by id asc across pages', async() => {
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

      const all = await prisma.clientAddress.findMany({
        where: { clientId },
        orderBy: { id: 'asc' },
      });

      const [page1, page2] = await Promise.all([
        sut.execute({ clientId, page: 1, size: 2 }),
        sut.execute({ clientId, page: 2, size: 2 }),
      ]);

      expect(page1.data[0].id).toBe(all[0].id);
      expect(page1.data[1].id).toBe(all[1].id);
      expect(page2.data[0].id).toBe(all[2].id);
      expect(page2.data[1].id).toBe(all[3].id);
    });
  });

  describe('filtering', () => {
    it.each([
      ClientAddressType.MAIN,
      ClientAddressType.BILLING,
      ClientAddressType.SUPPORT,
      ClientAddressType.CORRESPONDENCE,
    ])('should filter by type %s', async(type: ClientAddressType) => {
      await prisma.clientAddress.createMany({
        data: [
          {
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
          {
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
          {
            clientId,
            type: ClientAddressType.SUPPORT,
            zipCode: '33333-333',
            street: 'Rua Chamado',
            number: '3',
            complement: null,
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
          },
          {
            clientId,
            type: ClientAddressType.CORRESPONDENCE,
            zipCode: '44444-444',
            street: 'Rua Correspondência',
            number: '4',
            complement: null,
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
          },
        ],
      });

      const result = await sut.execute({ clientId, type });

      expect(result.totalItems).toBe(1);
      expect(result.data[0].type).toBe(type);
    });

    it('should search by street (case-insensitive)', async() => {
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

      const result = await sut.execute({ clientId, search: 'flores' });

      expect(result.totalItems).toBe(1);
      expect(result.data[0].street).toBe('Rua das Flores');
    });

    it('should search by city', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Teste',
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
          zipCode: '98765-432',
          street: 'Av. Principal',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'Rio de Janeiro',
          state: 'RJ',
        },
      });

      const result = await sut.execute({ clientId, search: 'Rio' });

      expect(result.totalItems).toBe(1);
      expect(result.data[0].city).toBe('Rio de Janeiro');
    });

    it('should search by zipCode', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua A',
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
          zipCode: '98765-432',
          street: 'Rua B',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.execute({ clientId, search: '98765' });

      expect(result.totalItems).toBe(1);
      expect(result.data[0].zipCode).toBe('98765-432');
    });

    it('should search by neighborhood', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Teste',
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
          zipCode: '98765-432',
          street: 'Av. Principal',
          number: '2',
          complement: null,
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.execute({ clientId, search: 'Jardins' });

      expect(result.totalItems).toBe(1);
      expect(result.data[0].neighborhood).toBe('Jardins');
    });

    it('should return empty when search matches no address', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '12345-678',
          street: 'Rua Teste',
          number: '1',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.execute({ clientId, search: 'Inexistente' });

      expect(result.totalItems).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('should combine type and search filters', async() => {
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

      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.BILLING,
          zipCode: '22222-222',
          street: 'Rua Principal',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.execute({
        clientId,
        type: ClientAddressType.MAIN,
        search: 'Principal',
      });

      expect(result.totalItems).toBe(1);
      expect(result.data[0].type).toBe(ClientAddressType.MAIN);
      expect(result.data[0].street).toBe('Rua Principal');
    });

    it('should paginate filtered results', async() => {
      await prisma.clientAddress.create({
        data: {
          clientId,
          type: ClientAddressType.MAIN,
          zipCode: '11111-111',
          street: 'Rua Centro',
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
          zipCode: '22222-222',
          street: 'Rua Centro',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });

      const result = await sut.execute({
        clientId,
        search: 'Centro',
        page: 1,
        size: 1,
      });

      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(1);
      expect(result.totalPages).toBe(2);
    });
  });
});
