import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientSequenceInvalidNextIdError } from 'src/app/client/client/domain/errors/client-sequence-invalid-next-id.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SetClientNextId } from './set-client-next-id.service';

describe('SetClientNextId - Integration tests', () => {
  let sut: SetClientNextId;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(SetClientNextId);
    prisma = module.get(PrismaService);
  });

  async function upsertSequence(nextId: number) {
    await prisma.clientSequence.upsert({
      where: { id: 1 },
      create: { id: 1, nextId },
      update: { nextId },
    });
  }

  beforeEach(async() => {
    await prisma.truncate();
    await upsertSequence(1);
  });

  afterAll(async() => {
    await prisma.truncate();
    await upsertSequence(1);
    await prisma.$disconnect();
  });

  async function createCompany() {
    const suffix = String(Date.now()).slice(-4);
    return prisma.company.create({
      data: {
        name: `Empresa ${Date.now()}`,
        fantasyName: 'Fantasia',
        document: `09.748.165/0001-${suffix}`,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '11999999999',
        email01: `test${suffix}@test.com`,
        active: true,
      },
    });
  }

  async function seedClientWithExplicitId(id: number) {
    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      createCompany(),
    ]);

    const suffix = String(Date.now()).slice(-4);
    return prisma.client.create({
      data: {
        id,
        type: ClientType.PJ,
        document: `09.748.165/0001-${suffix}`,
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Cliente Teste',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        companies: { connect: [{ id: company.id }] },
      },
    });
  }

  it('should set nextId when no clients exist and nextId is greater than maxId (0)', async() => {
    const result = await sut.execute({ nextId: 25 });

    expect(result.message).toBe('Próximo ID de cliente definido para 25.');

    const row = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
    expect(row.nextId).toBe(25);
  });

  it('should throw ClientSequenceInvalidNextIdError when nextId is not greater than max client id', async() => {
    const maxClientId = 5001;
    await seedClientWithExplicitId(maxClientId);

    try {
      await sut.execute({ nextId: maxClientId });
      throw new Error('expected ClientSequenceInvalidNextIdError');
    }
    catch (err: unknown) {
      expect(err).toBeInstanceOf(ClientSequenceInvalidNextIdError);
      expect((err as Error).message).toContain(`O próximo ID ${maxClientId} é inválido`);
      expect((err as Error).message).toContain(`maior ID de cliente existente é ${maxClientId}`);
    }

    const row = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
    expect(row.nextId).toBe(1);
  });

  it('should succeed when nextId is greater than max client id', async() => {
    const maxClientId = 5002;
    await seedClientWithExplicitId(maxClientId);

    const result = await sut.execute({ nextId: maxClientId + 1 });

    expect(result.message).toBe(`Próximo ID de cliente definido para ${maxClientId + 1}.`);

    const row = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
    expect(row.nextId).toBe(maxClientId + 1);
  });

  it('should reject nextId equal to 0 via business rule when maxId is 0', async() => {
    await expect(sut.execute({ nextId: 0 as unknown as number })).rejects.toThrow(
      ClientSequenceInvalidNextIdError,
    );
  });
});
