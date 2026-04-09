import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientGroupNotFoundError } from 'src/app/client/client-group/domain/errors/client-group-not-found.error';
import { ClientOwnerNotFoundError } from 'src/app/client/client-owner/domain/errors/client-owner-not-found.error';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
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

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
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
      ownerId: 0,
      companyIds: [1],
      companyName: 'Empresa LTDA',
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
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
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();
      expect(saved?.type).toBe(ClientType.PJ);
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.companyName).toBe('Empresa LTDA');
      expect(saved?.groupId).toBe(group.id);
      expect(saved?.ownerId).toBe(owner.id);

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
    });

    it('should persist MAIN address with complement when provided', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
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
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
        companyIds: [company.id],
        ie: '123456789',
        fantasyName: 'Empresa',
      });

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved?.ie).toBe('123456789');
      expect(saved?.fantasyName).toBe('Empresa');
    });

    it('should create client with PF type and CPF document', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({
        type: ClientType.PF,
        document: '974.563.215-58',
        groupId: group.id,
        ownerId: owner.id,
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
  });

  describe('document already taken', () => {
    it('should throw DocumentAlreadyTakenError when document already exists', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      await sut.execute(input);

      await expect(sut.execute(input)).rejects.toThrow(DocumentAlreadyTakenError);
      await expect(sut.execute(input)).rejects.toThrow('O documento 09748165000110 já está em uso.');
    });

    it('should not persist client when document is already taken', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });
      await sut.execute(input);

      const input2 = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
        companyIds: [company.id],
        document: '09.748.165/0001-10',
        companyName: 'Outra Empresa',
      });

      await expect(sut.execute(input2)).rejects.toThrow(DocumentAlreadyTakenError);

      const clients = await prisma.client.findMany({ where: { document: '09748165000110' } });
      expect(clients).toHaveLength(1);
    });
  });

  describe('group not found', () => {
    it('should throw ClientGroupNotFoundError when groupId does not exist', async() => {
      const [owner, company] = await Promise.all([
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: 99999, ownerId: owner.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
    });

    it('should throw ClientGroupNotFoundError when group is inactive', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: false } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
    });

    it('should not persist client when group does not exist', async() => {
      const [owner, company] = await Promise.all([
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: 99999, ownerId: owner.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();
    });
  });

  describe('company not found', () => {
    it('should throw CompanyNotFoundError when companyId does not exist', async() => {
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [99999] });

      await expect(sut.execute(input)).rejects.toThrow(CompanyNotFoundError);
    });

    it('should throw CompanyNotFoundError when company is inactive', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
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

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(CompanyNotFoundError);
    });
  });

  describe('owner not found', () => {
    it('should throw ClientOwnerNotFoundError when ownerId does not exist', async() => {
      const [group, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: 99999, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientOwnerNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Proprietário de clientes não encontrado na base de dados.');
    });

    it('should throw ClientOwnerNotFoundError when owner is inactive', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: false } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientOwnerNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Proprietário de clientes não encontrado na base de dados.');
    });

    it('should not persist client when owner does not exist', async() => {
      const [group, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: 99999, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientOwnerNotFoundError);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();
    });
  });

  describe('validation (factory)', () => {
    it('should throw when document has invalid format', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
        companyIds: [company.id],
        document: '123',
      });

      await expect(sut.execute(input)).rejects.toThrow(InvalidDocumentError);
    });

    it('should throw when type is invalid', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
        companyIds: [company.id],
        type: 'INVALID' as ClientType,
      });

      await expect(sut.execute(input)).rejects.toThrow();
    });
  });
});
