import { Test } from '@nestjs/testing';
import { ClientGroupNotFoundError } from 'src/app/client-group/domain/errors/client-group-not-found.error';
import { ClientOwnerNotFoundError } from 'src/app/client-owner/domain/errors/client-owner-not-found.error';
import { ClientModule } from 'src/app/client/client.module';
import { ClientInvoiceType } from 'src/app/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
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
      imports: [ClientModule, ConfigModule],
    }).compile();

    sut = module.get(CreateClient);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    if (prisma) {
      await prisma.truncate();
      await prisma.$disconnect();
    }
  });

  function makeValidInput(overrides: Partial<CreateClientInputDto> = {}): CreateClientInputDto {
    return {
      type: ClientType.PJ,
      document: '09.748.165/0001-10',
      ie: null,
      groupId: 0,
      ownerId: 0,
      companyName: 'Empresa LTDA',
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      ...overrides,
    };
  }

  describe('success path', () => {
    it('should create client and persist in database', async() => {
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id });

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
    });

    it('should create client with optional fields filled', async() => {
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
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
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({
        type: ClientType.PF,
        document: '974.563.215-58',
        groupId: group.id,
        ownerId: owner.id,
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
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id });

      await sut.execute(input);

      await expect(sut.execute(input)).rejects.toThrow(DocumentAlreadyTakenError);
      await expect(sut.execute(input)).rejects.toThrow('O documento 09748165000110 já está em uso.');
    });

    it('should not persist client when document is already taken', async() => {
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id });
      await sut.execute(input);

      const input2 = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
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
      const owner = await prisma.clientOwner.create({
        data: { name: `Owner ${Date.now()}`, active: true },
      });

      const input = makeValidInput({ groupId: 99999, ownerId: owner.id });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
    });

    it('should not persist client when group does not exist', async() => {
      const owner = await prisma.clientOwner.create({
        data: { name: `Owner ${Date.now()}`, active: true },
      });

      const input = makeValidInput({ groupId: 99999, ownerId: owner.id });

      await expect(sut.execute(input)).rejects.toThrow(ClientGroupNotFoundError);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();
    });
  });

  describe('owner not found', () => {
    it('should throw ClientOwnerNotFoundError when ownerId does not exist', async() => {
      const group = await prisma.clientGroup.create({
        data: { name: `Grupo ${Date.now()}`, active: true },
      });

      const input = makeValidInput({ groupId: group.id, ownerId: 99999 });

      await expect(sut.execute(input)).rejects.toThrow(ClientOwnerNotFoundError);
      await expect(sut.execute(input)).rejects.toThrow('Proprietário de clientes não encontrado na base de dados.');
    });

    it('should not persist client when owner does not exist', async() => {
      const group = await prisma.clientGroup.create({
        data: { name: `Grupo ${Date.now()}`, active: true },
      });

      const input = makeValidInput({ groupId: group.id, ownerId: 99999 });

      await expect(sut.execute(input)).rejects.toThrow(ClientOwnerNotFoundError);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();
    });
  });

  describe('validation (factory)', () => {
    it('should throw when document has invalid format', async() => {
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
        document: '123',
      });

      await expect(sut.execute(input)).rejects.toThrow(InvalidDocumentError);
    });

    it('should throw when type is invalid', async() => {
      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const input = makeValidInput({
        groupId: group.id,
        ownerId: owner.id,
        type: 'INVALID' as ClientType,
      });

      await expect(sut.execute(input)).rejects.toThrow();
    });
  });
});
