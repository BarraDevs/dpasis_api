import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientFactory } from 'src/app/client/client/domain/factories/client.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientRepositoryAdapterPrisma } from './client-prisma.repository';

describe('ClientRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function createClientGroupAndOwner() {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    return { group, owner };
  }

  describe('save', () => {
    it('should persist client in clients table with correct data', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: '123456789',
        groupId: group.id,
        ownerId: owner.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa LTDA',
        fantasyName: 'Empresa',
        headquarters: 'São Paulo',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.type).toBe(ClientType.PJ);
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.ie).toBe('123456789');
      expect(saved?.groupId).toBe(group.id);
      expect(saved?.ownerId).toBe(owner.id);
      expect(saved?.companyName).toBe('Empresa LTDA');
      expect(saved?.fantasyName).toBe('Empresa');
      expect(saved?.headquarters).toBe('São Paulo');
      expect(saved?.invoiceType).toBe(ClientInvoiceType.CONTRACT);
      expect(saved?.generateInvoice).toBe(true);
      expect(saved?.active).toBe(true);
      expect(saved?.createdAt).toBeInstanceOf(Date);
      expect(saved?.updatedAt).toBeInstanceOf(Date);
    });

    it('should persist client with optional fields as null', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const entity = ClientFactory.create({
        type: ClientType.PF,
        document: '974.563.215-58',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        companyName: 'Pessoa Física',
        fantasyName: null,
        headquarters: 'Rio de Janeiro',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '97456321558' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.ie).toBeNull();
      expect(saved?.fantasyName).toBeNull();
      expect(saved?.type).toBe(ClientType.PF);
      expect(saved?.companyName).toBe('Pessoa Física');
      expect(saved?.generateInvoice).toBe(false);
    });
  });

  describe('edit', () => {
    it('should update client in database', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Nome Original',
        fantasyName: null,
        headquarters: 'São Paulo',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();

      const entityToEdit = ClientFactory.edit({
        ...entity.props,
        id: saved!.id,
        companyName: 'Nome Atualizado',
        fantasyName: 'Nova Fantasia',
      });

      await sut.edit(entityToEdit);

      const updated = await prisma.client.findUnique({
        where: { id: saved!.id },
      });

      expect(updated?.companyName).toBe('Nome Atualizado');
      expect(updated?.fantasyName).toBe('Nova Fantasia');
      expect(updated?.document).toBe('09748165000110');
    });
  });

  describe('findById', () => {
    it('should return null when client does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return client entity when found', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa',
        fantasyName: null,
        headquarters: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();

      const found = await sut.findById(saved!.id);

      expect(found).not.toBeNull();
      expect(found?.props.id).toBe(saved!.id);
      expect(found?.props.companyName).toBe('Empresa');
      expect(found?.props.document).toBe('09748165000110');
    });
  });

  describe('delete', () => {
    it('should remove client from database', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa',
        fantasyName: null,
        headquarters: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();

      await sut.delete(saved!.id);

      const deleted = await prisma.client.findUnique({
        where: { id: saved!.id },
      });

      expect(deleted).toBeNull();
    });
  });
});
