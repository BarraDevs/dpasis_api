import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client-address/domain/enums/client-address-type.enum';
import { ClientAddressFactory } from 'src/app/client-address/domain/factories/client-address.factory';
import { ClientInvoiceType } from 'src/app/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAddressRepositoryAdapterPrisma } from './client-address-prisma.repository';

describe('ClientAddressRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientAddressRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientAddressRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientAddressRepositoryAdapterPrisma);
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

  describe('save', () => {
    it('should persist client address in client_addresses table with correct data', async() => {
      const entity = ClientAddressFactory.create({
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.clientAddress.findFirst({
        where: { clientId, type: ClientAddressType.MAIN },
      });

      expect(saved).not.toBeNull();
      expect(saved?.clientId).toBe(clientId);
      expect(saved?.type).toBe(ClientAddressType.MAIN);
      expect(saved?.zipCode).toBe('12345-678');
      expect(saved?.street).toBe('Rua Teste');
      expect(saved?.number).toBe('123');
      expect(saved?.complement).toBe('Apto 101');
      expect(saved?.neighborhood).toBe('Centro');
      expect(saved?.city).toBe('São Paulo');
      expect(saved?.state).toBe('SP');
      expect(saved?.createdAt).toBeInstanceOf(Date);
      expect(saved?.updatedAt).toBeInstanceOf(Date);
    });

    it('should persist client address with null complement', async() => {
      const entity = ClientAddressFactory.create({
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '98765-432',
        street: 'Av. Principal',
        number: '456',
        complement: null,
        neighborhood: 'Jardins',
        city: 'Rio de Janeiro',
        state: 'RJ',
      });

      await sut.save(entity);

      const saved = await prisma.clientAddress.findFirst({
        where: { clientId, type: ClientAddressType.BILLING },
      });

      expect(saved).not.toBeNull();
      expect(saved?.complement).toBeNull();
      expect(saved?.street).toBe('Av. Principal');
    });

    it('should return the id of the saved client address', async() => {
      const entity = ClientAddressFactory.create({
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      });

      const id = await sut.save(entity);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
    });
  });

  describe('edit', () => {
    it('should update client address in database', async() => {
      const entity = ClientAddressFactory.create({
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Original',
        number: '100',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.clientAddress.findFirst({
        where: { clientId, type: ClientAddressType.MAIN },
      });
      expect(saved).not.toBeNull();

      const entityToEdit = ClientAddressFactory.load({
        id: saved!.id,
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Atualizada',
        number: '200',
        complement: 'Sala 5',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      });

      await sut.edit(entityToEdit);

      const updated = await prisma.clientAddress.findUnique({
        where: { id: saved!.id },
      });

      expect(updated?.street).toBe('Rua Atualizada');
      expect(updated?.number).toBe('200');
      expect(updated?.complement).toBe('Sala 5');
    });
  });

  describe('findById', () => {
    it('should return null when client address does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return client address entity when found', async() => {
      const entity = ClientAddressFactory.create({
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 1',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.clientAddress.findFirst({
        where: { clientId, type: ClientAddressType.MAIN },
      });
      expect(saved).not.toBeNull();

      const found = await sut.findById(saved!.id);

      expect(found).not.toBeNull();
      expect(found?.props.id).toBe(saved!.id);
      expect(found?.props.clientId).toBe(clientId);
      expect(found?.props.street).toBe('Rua Teste');
      expect(found?.props.zipCode).toBe('12345-678');
      expect(found?.isMain()).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove client address from database', async() => {
      const entity = ClientAddressFactory.create({
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.clientAddress.findFirst({
        where: { clientId, type: ClientAddressType.MAIN },
      });
      expect(saved).not.toBeNull();

      await sut.delete(saved!.id);

      const deleted = await prisma.clientAddress.findUnique({
        where: { id: saved!.id },
      });

      expect(deleted).toBeNull();
    });
  });
});
