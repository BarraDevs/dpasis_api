import { Test } from '@nestjs/testing';
import { ClientItemProps } from 'src/app/client/client-item/domain/entities/client-item.entity';
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
  let cnaeNbsIndopId: number;

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

    const [group, owner, cnae, nbs, indop] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.cnae.create({ data: { code: 'cnae-code', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: 'nbs-code', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: 'indop-code', description: 'INDOP Test', active: true } }),
    ]);

    const cni = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });
    cnaeNbsIndopId = cni.id;

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
        cnaeNbsIndopId,
      });

      const id = await sut.save(entity);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientItem.findUnique({
        where: { id },
        include: {
          cnaeNbsIndop: {
            include: {
              cnae: true,
              nbs: true,
              indop: true,
            },
          },
        },
      });
      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Item de teste');
      expect(saved?.quantity).toBe(2);
      expect(saved?.unitValueInCents).toBe(10000);
      expect(saved?.cnaeNbsIndopId).toBe(cnaeNbsIndopId);
      expect(saved?.clientId).toBe(clientId);
      expect(saved?.cnaeNbsIndop?.cnae?.code).toBe('cnae-code');
      expect(saved?.cnaeNbsIndop?.nbs?.code).toBe('nbs-code');
      expect(saved?.cnaeNbsIndop?.indop?.code).toBe('indop-code');
    });

    it('should persist entity with quantity zero', async() => {
      const entity = ClientItemFactory.create({
        clientId,
        description: 'Item qty zero',
        quantity: 0,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
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
        cnaeNbsIndopId,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientItem.findUnique({ where: { id } });
      expect(saved?.unitValueInCents).toBe(0);
    });

    it('should persist description at boundary length', async() => {
      const longDesc = 'a'.repeat(255);
      const entity = ClientItemFactory.create({
        clientId,
        description: longDesc,
        quantity: 1,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientItem.findUnique({ where: { id } });
      expect(saved?.description).toBe(longDesc);
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
          cnaeNbsIndopId,
          active: true,
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
          cnaeNbsIndopId,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result?.props).toEqual<ClientItemProps>({
        id: created.id,
        clientId: created.clientId,
        description: created.description,
        quantity: created.quantity,
        unitValueInCents: created.unitValueInCents,
        cnaeNbsIndopId: created.cnaeNbsIndopId,
        active: created.active,
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
          cnaeNbsIndopId,
          active: true,
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

    it('should update only cnaeNbsIndopId', async() => {
      const [cnae2, nbs2, indop2] = await Promise.all([
        prisma.cnae.create({ data: { code: '9999999', description: 'CNAE 2', active: true } }),
        prisma.nbs.create({ data: { code: '88888888', description: 'NBS 2', active: true } }),
        prisma.indop.create({ data: { code: '5', description: 'INDOP 2', active: true } }),
      ]);
      const cni2 = await prisma.cnaeNbsIndop.create({
        data: { cnaeId: cnae2.id, nbsId: nbs2.id, indopId: indop2.id },
      });

      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Descrição fixa',
          quantity: 1,
          unitValueInCents: 10000,
          cnaeNbsIndopId,
          active: true,
        },
      });

      const existing = await sut.findById(created.id);
      const updated = ClientItemFactory.edit(existing!, {
        cnaeNbsIndopId: cni2.id,
      });

      await sut.edit(updated);

      const saved = await prisma.clientItem.findUnique({ where: { id: created.id } });
      expect(saved?.description).toBe('Descrição fixa');
      expect(saved?.quantity).toBe(1);
      expect(saved?.cnaeNbsIndopId).toBe(cni2.id);
    });

    it('should update quantity to zero', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item',
          quantity: 10,
          unitValueInCents: 10000,
          cnaeNbsIndopId,
          active: true,
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
          cnaeNbsIndopId,
          active: true,
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
