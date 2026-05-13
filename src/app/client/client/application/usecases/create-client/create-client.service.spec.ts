import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientGroupNotFoundError } from 'src/app/client/client-group/domain/errors/client-group-not-found.error';
import { ResaleNotFoundError } from 'src/app/resale/resale/domain/errors/resale-not-found.error';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientIdAlreadyTakenError } from 'src/app/client/client/domain/errors/client-id-already-taken.error';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { CreateClient } from './create-client.service';
import { CreateClientInputDto } from './dtos/create-client.dto';

describe('CreateClient - Integration tests', () => {
  let sut: CreateClient;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(CreateClient);
    prisma = module.get(PrismaService);
  });

  async function resetClientSequence(nextId = 1) {
    await prisma.clientSequence.upsert({
      where: { id: 1 },
      create: { id: 1, nextId },
      update: { nextId },
    });
  }

  beforeEach(async() => {
    await prisma.truncate();
    await resetClientSequence(1);
  });

  afterAll(async() => {
    await prisma.truncate();
    await resetClientSequence(1);
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

  function makeValidInput(overrides: Partial<CreateClientInputDto> = {}): CreateClientInputDto {
    return {
      type: ClientType.PJ,
      document: '09.748.165/0001-10',
      ie: null,
      groupId: 0,
      resaleId: 0,
      companyIds: [1],
      companyName: 'Empresa LTDA',
      fantasyName: null,
      socialName: null,
      domain: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      parentClientId: null,
      address: {
        zipCode: '12345-678',
        street: 'Rua das Laranjeiras',
        number: '100',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
      ...overrides,
    };
  }

  describe('success path', () => {
    it('should create client and persist in database', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: resale.id, companyIds: [company.id] });

      const result = await sut.execute(input);

      expect(result.id).toBe(1);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();
      expect(saved?.type).toBe(ClientType.PJ);
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.companyName).toBe('Empresa LTDA');
      expect(saved?.groupId).toBe(group.id);
      expect(saved?.resaleId).toBe(resale.id);

      const address = await prisma.clientAddress.findFirst({
        where: { clientId: result.id, type: ClientAddressType.MAIN },
      });
      expect(address).not.toBeNull();
      expect(address?.type).toBe(ClientAddressType.MAIN);
      expect(address?.zipCode).toBe('12345-678');
      expect(address?.street).toBe('Rua das Laranjeiras');
      expect(address?.number).toBe('100');
      expect(address?.complement).toBeNull();
      expect(address?.neighborhood).toBe('Centro');
      expect(address?.city).toBe('São Paulo');
      expect(address?.state).toBe('SP');

      const seq = await prisma.clientSequence.findUnique({ where: { id: 1 } });
      expect(seq?.nextId).toBe(2);
    });

    it('should allocate id from client sequence when id is omitted (getAndIncrement)', async() => {
      await resetClientSequence(9000);

      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: resale.id, companyIds: [company.id] });

      const result = await sut.execute(input);

      expect(result.id).toBe(9000);

      const seq = await prisma.clientSequence.findUnique({ where: { id: 1 } });
      expect(seq?.nextId).toBe(9001);
    });

    it('should persist MAIN address with complement when provided', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        address: {
          ...makeValidInput().address,
          complement: 'Apto 202',
        },
      });

      const result = await sut.execute(input);

      const address = await prisma.clientAddress.findFirst({
        where: { clientId: result.id, type: ClientAddressType.MAIN },
      });
      expect(address?.complement).toBe('Apto 202');
    });

    it('should create client with optional fields filled', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        ie: '123456789',
        fantasyName: 'Empresa',
        socialName: 'Razão integrada LTDA',
      });

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved?.ie).toBe('123456789');
      expect(saved?.fantasyName).toBe('Empresa');
      expect(saved?.socialName).toBe('Razão integrada LTDA');
    });

    it('should persist domain when provided', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        domain: 'integracao.persist.dev',
      });

      const result = await sut.execute(input);

      const saved = await prisma.client.findUnique({ where: { id: result.id } });
      expect(saved?.domain).toBe('integracao.persist.dev');
    });

    it('should create client with PF type and CPF document', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({
        type: ClientType.PF,
        document: '974.563.215-58',
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
      });

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');

      const saved = await prisma.client.findFirst({
        where: { document: '97456321558' },
      });
      expect(saved?.type).toBe(ClientType.PF);
      expect(saved?.document).toBe('97456321558');
    });

    it('should persist client with explicit id when provided', async() => {
      const explicitId = 71_000;
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        id: explicitId,
      });

      const result = await sut.execute(input);

      expect(result.id).toBe(explicitId);

      const saved = await prisma.client.findUnique({ where: { id: explicitId } });
      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(explicitId);
      expect(saved?.document).toBe('09748165000110');

      const seq = await prisma.clientSequence.findUnique({ where: { id: 1 } });
      expect(seq?.nextId).toBeGreaterThanOrEqual(explicitId + 1);
    });
  });

  describe('id already taken', () => {
    it('should throw ClientIdAlreadyTakenError when id already exists', async() => {
      const explicitId = 72_000;
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const inputFirst = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        id: explicitId,
      });
      await sut.execute(inputFirst);

      const inputSecond = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        id: explicitId,
        type: ClientType.PF,
        document: '974.563.215-58',
      });

      try {
        await sut.execute(inputSecond);
        throw new Error('expected ClientIdAlreadyTakenError');
      }
      catch (err: unknown) {
        expect(err).toBeInstanceOf(ClientIdAlreadyTakenError);
        expect((err as Error).message).toMatch(new RegExp(`O id ${explicitId} já está em uso`));
      }
    });
  });

  describe('duplicate document allowed', () => {
    it('should create two clients with the same normalized document', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input1 = makeValidInput({ groupId: group.id, resaleId: resale.id, companyIds: [company.id] });
      const { id: id1 } = await sut.execute(input1);

      const input2 = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        document: '09.748.165/0001-10',
        companyName: 'Outra Empresa',
      });
      const { id: id2 } = await sut.execute(input2);

      expect(id1).not.toBe(id2);
      const clients = await prisma.client.findMany({ where: { document: '09748165000110' } });
      expect(clients).toHaveLength(2);
    });
  });

  describe('group not found', () => {
    it('should throw ClientGroupNotFoundError when groupId does not exist', async() => {
      const [resale, company] = await Promise.all([
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: 99999, resaleId: resale.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
    });

    it('should throw ClientGroupNotFoundError when group is inactive', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: false } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: resale.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
    });

    it('should not persist client when group does not exist', async() => {
      const [resale, company] = await Promise.all([
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: 99999, resaleId: resale.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();
    });
  });

  describe('company not found', () => {
    it('should throw CompanyNotFoundError when companyId does not exist', async() => {
      const [group, resale] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: resale.id, companyIds: [99999] });

      await expect(sut.execute(input)).rejects.toThrow(CompanyNotFoundError);
    });

    it('should throw CompanyNotFoundError when company is inactive', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        prisma.company.create({
          data: {
            name: `Empresa ${Date.now()}`,
            fantasyName: 'Fantasia',
            document: `09.748.165/0001-${String(Date.now() % 100).padStart(2, '0')}`,
            zipCode: '01310100',
            street: 'Av Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            phone01: '11999999999',
            email01: 'inactive@test.com',
            active: false,
          },
        }),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: resale.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(CompanyNotFoundError);
    });
  });

  describe('resale not found', () => {
    it('should throw ResaleNotFoundError when resaleId does not exist', async() => {
      const [group, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: 99999, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ResaleNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Revenda não encontrada na base de dados.');
    });

    it('should throw ResaleNotFoundError when resale is inactive', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: { ...buildMinimalResaleData(nextResaleFixtureId()), active: false } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: resale.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ResaleNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Revenda não encontrada na base de dados.');
    });

    it('should not persist client when resale does not exist', async() => {
      const [group, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, resaleId: 99999, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ResaleNotFoundError);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();
    });
  });

  describe('validation (factory)', () => {
    it('should throw when document has invalid format', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        document: '123',
      });

      await expect(sut.execute(input)).rejects.toThrow(InvalidDocumentError);
    });

    it('should throw when type is invalid', async() => {
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        resaleId: resale.id,
        companyIds: [company.id],
        type: 'INVALID' as ClientType,
      });

      await expect(sut.execute(input)).rejects.toThrow();
    });
  });
});
