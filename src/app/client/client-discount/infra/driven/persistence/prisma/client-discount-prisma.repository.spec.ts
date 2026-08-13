import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { ClientDiscountFactory } from 'src/app/client/client-discount/domain/factories/client-discount.factory';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDiscountRepositoryAdapterPrisma } from './client-discount-prisma.repository';

describe('ClientDiscountRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientDiscountRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientDiscountRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientDiscountRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
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
    it('should persist entity in client_discounts table', async() => {
      const entity = ClientDiscountFactory.create({
        clientId,
        description: 'Desconto 10%',
        type: DiscountType.PERCENTAGE,
        discountValue: 1000,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientDiscount.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Desconto 10%');
      expect(saved?.discountValue).toBe(1000);
    });

    it('should return the created id', async() => {
      const entity = ClientDiscountFactory.create({
        clientId,
        description: 'Desconto teste',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
      });

      const id = await sut.save(entity);

      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
      const saved = await prisma.clientDiscount.findUnique({ where: { id } });
      expect(saved?.id).toBe(id);
    });

    it('should persist MONETARY type discount', async() => {
      const entity = ClientDiscountFactory.create({
        clientId,
        description: 'Desconto R$ 50,00',
        type: DiscountType.MONETARY,
        discountValue: 5000,
        month: 6,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientDiscount.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.type).toBe(DiscountType.MONETARY);
      expect(saved?.discountValue).toBe(5000);
    });

    it('should persist with doNotGenerateCharge and terminateContract true', async() => {
      const entity = ClientDiscountFactory.create({
        clientId,
        description: 'Desconto especial',
        type: DiscountType.PERCENTAGE,
        discountValue: 100,
        month: 12,
        year: 2026,
        doNotGenerateCharge: true,
        terminateContract: true,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientDiscount.findUnique({ where: { id } });
      expect(saved?.doNotGenerateCharge).toBe(true);
      expect(saved?.terminateContract).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return null when discount does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return entity when discount exists', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto teste',
          type: DiscountType.MONETARY,
          discountValue: 5000,
          month: 1,
          year: 2026,
          doNotGenerateCharge: true,
          terminateContract: false,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props.id).toBe(created.id);
      expect(result?.props.description).toBe('Desconto teste');
    });

    it('should return entity with all props correctly mapped', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto completo',
          type: DiscountType.PERCENTAGE,
          discountValue: 1050,
          month: 3,
          year: 2025,
          doNotGenerateCharge: true,
          terminateContract: true,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props).toMatchObject({
        id: created.id,
        clientId,
        description: 'Desconto completo',
        type: DiscountType.PERCENTAGE,
        discountValue: 1050,
        month: 3,
        year: 2025,
        doNotGenerateCharge: true,
        terminateContract: true,
      });
    });

    it('should return entity with props getter', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Test',
          type: DiscountType.PERCENTAGE,
          discountValue: 100,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props).toBeDefined();
      expect(result?.props.id).toBe(created.id);
    });
  });

  describe('edit', () => {
    it('should update existing discount', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Original',
          type: DiscountType.PERCENTAGE,
          discountValue: 500,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const entity = ClientDiscountFactory.edit({
        ...created,
        description: 'Atualizado',
        type: DiscountType.MONETARY,
        discountValue: 1000,
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
      expect(updated?.description).toBe('Atualizado');
      expect(updated?.type).toBe(DiscountType.MONETARY);
      expect(updated?.discountValue).toBe(1000);
      expect(updated?.active).toBe(false);
    });

    it('should update all fields including type and flags', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Original',
          type: DiscountType.PERCENTAGE,
          discountValue: 500,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const entity = ClientDiscountFactory.edit({
        id: created.id,
        clientId,
        description: 'Desconto monetário atualizado',
        type: DiscountType.MONETARY,
        discountValue: 15000,
        month: 12,
        year: 2025,
        doNotGenerateCharge: true,
        terminateContract: true,
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
      expect(updated?.description).toBe('Desconto monetário atualizado');
      expect(updated?.type).toBe(DiscountType.MONETARY);
      expect(updated?.discountValue).toBe(15000);
      expect(updated?.month).toBe(12);
      expect(updated?.year).toBe(2025);
      expect(updated?.doNotGenerateCharge).toBe(true);
      expect(updated?.terminateContract).toBe(true);
      expect(updated?.active).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove discount from database', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Para deletar',
          type: DiscountType.PERCENTAGE,
          discountValue: 100,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      await sut.delete(created.id);

      const deleted = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });
  });
});
