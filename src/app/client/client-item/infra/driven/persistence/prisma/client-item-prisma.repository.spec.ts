import { Test } from '@nestjs/testing';
import { ClientItemFactory } from 'src/app/client/client-item/domain/factories/client-item.factory';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemRepositoryAdapterPrisma } from './client-item-prisma.repository';

describe('ClientItemRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientItemRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientItemRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientItemRepositoryAdapterPrisma);
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
    it('should create client item and return id', async() => {
      const entity = ClientItemFactory.create({
        clientId,
        description: 'Item de teste',
        quantity: 2,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      });

      const id = await sut.save(entity);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientItem.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Item de teste');
      expect(saved?.quantity).toBe(2);
      expect(saved?.unitValueInCents).toBe(10000);
    });

    it('should persist entity with quantity zero', async() => {
      const entity = ClientItemFactory.create({
        clientId,
        description: 'Item qty zero',
        quantity: 0,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientItem.findUnique({ where: { id } });
      expect(saved?.quantity).toBe(0);
    });

    it('should persist entity with unitValueInCents zero', async() => {
      const entity = ClientItemFactory.create({
        clientId,
        description: 'Item valor zero',
        quantity: 5,
        unitValueInCents: 0,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientItem.findUnique({ where: { id } });
      expect(saved?.unitValueInCents).toBe(0);
    });

    it('should persist all string fields at boundary lengths', async() => {
      const longDesc = 'a'.repeat(255);
      const maxStr = 'x'.repeat(50);
      const entity = ClientItemFactory.create({
        clientId,
        description: longDesc,
        quantity: 1,
        unitValueInCents: 10000,
        cnae: maxStr,
        nbs: maxStr,
        indop: maxStr,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientItem.findUnique({ where: { id } });
      expect(saved?.description).toBe(longDesc);
      expect(saved?.cnae).toBe(maxStr);
      expect(saved?.nbs).toBe(maxStr);
      expect(saved?.indop).toBe(maxStr);
    });
  });

  describe('findById', () => {
    it('should return null when client item does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return null when id is 0', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return null when id is negative', async() => {
      const result = await sut.findById(-1);

      expect(result).toBeNull();
    });

    it('should return ClientItem entity by id', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item de teste',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props.id).toBe(created.id);
      expect(result?.props.description).toBe('Item de teste');
    });

    it('should return entity with all props correctly mapped', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item completo',
          quantity: 7,
          unitValueInCents: 3333,
          cnae: '6201501',
          nbs: '01010101',
          indop: 'INDOP-1',
        },
      });

      const result = await sut.findById(created.id);

      expect(result?.props).toEqual({
        id: created.id,
        clientId: created.clientId,
        description: created.description,
        quantity: created.quantity,
        unitValueInCents: created.unitValueInCents,
        cnae: created.cnae,
        nbs: created.nbs,
        indop: created.indop,
      });
    });
  });

  describe('edit', () => {
    it('should update client item', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item original',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });

      const existing = await sut.findById(created.id);
      const updated = ClientItemFactory.edit(existing!, {
        description: 'Descrição atualizada',
        quantity: 5,
        unitValueInCents: 20000,
      });

      await sut.edit(updated);

      const saved = await prisma.clientItem.findUnique({ where: { id: created.id } });
      expect(saved?.description).toBe('Descrição atualizada');
      expect(saved?.quantity).toBe(5);
      expect(saved?.unitValueInCents).toBe(20000);
    });

    it('should update only cnae, nbs, indop', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Descrição fixa',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1111111',
          nbs: '22222222',
          indop: '1',
        },
      });

      const existing = await sut.findById(created.id);
      const updated = ClientItemFactory.edit(existing!, {
        cnae: '9999999',
        nbs: '88888888',
        indop: '5',
      });

      await sut.edit(updated);

      const saved = await prisma.clientItem.findUnique({ where: { id: created.id } });
      expect(saved?.description).toBe('Descrição fixa');
      expect(saved?.quantity).toBe(1);
      expect(saved?.cnae).toBe('9999999');
      expect(saved?.nbs).toBe('88888888');
      expect(saved?.indop).toBe('5');
    });

    it('should update quantity to zero', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item',
          quantity: 10,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });

      const existing = await sut.findById(created.id);
      const updated = ClientItemFactory.edit(existing!, { quantity: 0 });

      await sut.edit(updated);

      const saved = await prisma.clientItem.findUnique({ where: { id: created.id } });
      expect(saved?.quantity).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete client item from database', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item para deletar',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });

      await sut.delete(created.id);

      const deleted = await prisma.clientItem.findUnique({
        where: { id: created.id },
      });
      expect(deleted).toBeNull();
    });

    it('should throw when deleting non-existent id', async() => {
      await expect(sut.delete(99999)).rejects.toThrow();
    });
  });
});
