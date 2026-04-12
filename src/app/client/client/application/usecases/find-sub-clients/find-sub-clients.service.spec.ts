import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindSubClients } from './find-sub-clients.service';

describe('FindSubClients - Integration tests', () => {
  let sut: FindSubClients;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(FindSubClients);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function createGroupAndOwner() {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    return { group, owner };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty pagination when client has no sub-clients', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(parent.id, {});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.currentPage).toBe(1);
  });

  it('should throw ClientNotFoundError for non-existent client id', async() => {
    await expect(sut.execute(99999, {})).rejects.toThrow(ClientNotFoundError);
  });

  it('should return empty pagination when client is itself a sub-client', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 2,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const child = await prisma.client.create({
      data: {
        id: 3,
        type: ClientType.PF,
        document: '97456321558',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Sub-cliente',
        headquarters: 'RJ',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        active: true,
        parentClientId: parent.id,
        isSubClient: true,
      },
    });

    const result = await sut.execute(child.id, {});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all sub-clients of a parent', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 4,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await Promise.all([
      prisma.client.create({
        data: {
          id: 5,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub-cliente 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
      prisma.client.create({
        data: {
          id: 6,
          type: ClientType.PF,
          document: '97456321558',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub-cliente 2',
          headquarters: 'RJ',
          invoiceType: ClientInvoiceType.INDIVIDUAL,
          generateInvoice: false,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
    ]);

    const result = await sut.execute(parent.id, {});

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every(c => c.parentClientId === parent.id)).toBe(true);
    expect(result.data.every(c => c.isSubClient === true)).toBe(true);
  });

  it('should return sub-clients ordered by id ascending', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 7,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const first = await prisma.client.create({
      data: {
        id: 8,
        type: ClientType.PJ,
        document: '09748165000121',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Sub-cliente A',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        parentClientId: parent.id,
        isSubClient: true,
      },
    });

    const second = await prisma.client.create({
      data: {
        id: 9,
        type: ClientType.PF,
        document: '97456321558',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Sub-cliente B',
        headquarters: 'RJ',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        active: true,
        parentClientId: parent.id,
        isSubClient: true,
      },
    });

    const result = await sut.execute(parent.id, {});

    expect(result.data[0].id).toBe(first.id);
    expect(result.data[1].id).toBe(second.id);
  });

  it('should not return sub-clients from a different parent', async() => {
    const { group, owner } = await createGroupAndOwner();

    const [parent1, parent2] = await Promise.all([
      prisma.client.create({
        data: {
          id: 10,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Pai 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      }),
      prisma.client.create({
        data: {
          id: 11,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Pai 2',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      }),
    ]);

    await prisma.client.create({
      data: {
        id: 12,
        type: ClientType.PF,
        document: '97456321558',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Sub-cliente do Pai 2',
        headquarters: 'RJ',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        active: true,
        parentClientId: parent2.id,
        isSubClient: true,
      },
    });

    const result = await sut.execute(parent1.id, {});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should paginate sub-clients correctly', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 130,
        type: ClientType.PJ,
        document: '19748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        prisma.client.create({
          data: {
            id: i,
            type: ClientType.PJ,
            document: `097481650001${String(i).padStart(2, '0')}`,
            groupId: group.id,
            ownerId: owner.id,
            companyName: `Sub-cliente ${i + 1}`,
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
      ),
    );

    const result = await sut.execute(parent.id, { page: 1, size: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.totalItems).toBe(15);
    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
  });

  it('should return correct page 2 for sub-clients', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 150,
        type: ClientType.PJ,
        document: '19748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        prisma.client.create({
          data: {
            id: i,
            type: ClientType.PJ,
            document: `097481650001${String(i).padStart(2, '0')}`,
            groupId: group.id,
            ownerId: owner.id,
            companyName: `Sub-cliente ${i + 1}`,
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
      ),
    );

    const result = await sut.execute(parent.id, { page: 2, size: 10 });

    expect(result.data).toHaveLength(5);
    expect(result.currentPage).toBe(2);
    expect(result.totalItems).toBe(15);
    expect(result.totalPages).toBe(2);
  });

  it('should filter sub-clients by search in companyName (case-insensitive)', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 17,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await Promise.all([
      prisma.client.create({
        data: {
          id: 18,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub Premium LTDA',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
      prisma.client.create({
        data: {
          id: 19,
          type: ClientType.PJ,
          document: '09748165000132',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub Básica',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
    ]);

    const result = await sut.execute(parent.id, { search: 'premium' });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].companyName).toBe('Sub Premium LTDA');
  });

  it('should filter sub-clients by search in document', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 20,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await Promise.all([
      prisma.client.create({
        data: {
          id: 21,
          type: ClientType.PJ,
          document: '33000167000101',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub A',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
      prisma.client.create({
        data: {
          id: 22,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub B',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
    ]);

    const result = await sut.execute(parent.id, { search: '33000167' });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].document).toBe('33000167000101');
  });

  it('should filter sub-clients by active status', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 23,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await Promise.all([
      prisma.client.create({
        data: {
          id: 24,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub Ativo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
      prisma.client.create({
        data: {
          id: 25,
          type: ClientType.PJ,
          document: '09748165000132',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Sub Inativo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
    ]);

    const resultActive = await sut.execute(parent.id, { active: true });
    expect(resultActive.data).toHaveLength(1);
    expect(resultActive.totalItems).toBe(1);
    expect(resultActive.data[0].active).toBe(true);

    const resultInactive = await sut.execute(parent.id, { active: false });
    expect(resultInactive.data).toHaveLength(1);
    expect(resultInactive.totalItems).toBe(1);
    expect(resultInactive.data[0].active).toBe(false);
  });

  it('should combine search and active filters', async() => {
    const { group, owner } = await createGroupAndOwner();

    const parent = await prisma.client.create({
      data: {
        id: 26,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await Promise.all([
      prisma.client.create({
        data: {
          id: 27,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Tech Ativo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
      prisma.client.create({
        data: {
          id: 28,
          type: ClientType.PJ,
          document: '09748165000132',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Tech Inativo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
          parentClientId: parent.id,
          isSubClient: true,
        },
      }),
    ]);

    const result = await sut.execute(parent.id, { search: 'Tech', active: true });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].companyName).toBe('Tech Ativo');
    expect(result.data[0].active).toBe(true);
  });
});
