import { Test } from '@nestjs/testing';
import { ServiceCatalogProps } from 'src/app/service/service-catalog/domain/entities/service-catalog.entity';
import { ServiceCatalogFactory } from 'src/app/service/service-catalog/domain/factories/service-catalog.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedServiceCatalogForeignKeys, serviceFkScalars } from './service-catalog-prisma-test.helpers';
import { ServiceCatalogRepositoryAdapterPrisma } from './service-catalog-prisma.repository';

describe('ServiceCatalogRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ServiceCatalogRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceCatalogRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceCatalogRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should persist entity in services table (prisma.service)', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const entity = ServiceCatalogFactory.create({
        ...serviceFkScalars(fk),
        companyIds: [fk.companyId],
        name: 'Serviço catálogo',
        unitPriceInCents: 15000,
        description: 'Descrição do serviço',
        isCommercial: true,
      });

      const id = await sut.save(entity);

      const saved = await prisma.service.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        id,
        cnaeNbsIndopId: fk.cnaeNbsIndopId,
        serviceBilledId: fk.serviceBilledId,
        serviceCategoryId: fk.serviceCategoryId,
        serviceDeliveryTermId: fk.serviceDeliveryTermId,
        serviceFreightId: fk.serviceFreightId,
        serviceProposalValidityId: fk.serviceProposalValidityId,
        serviceWarrantyId: fk.serviceWarrantyId,
        name: 'Serviço catálogo',
        unitPriceInCents: 15000,
        description: 'Descrição do serviço',
        isCommercial: true,
        active: true,
        createdAt: saved!.createdAt,
        updatedAt: saved!.updatedAt,
      });
    });

    it('should return the created id present in services', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const entity = ServiceCatalogFactory.create({
        ...serviceFkScalars(fk),
        companyIds: [fk.companyId],
        name: `Id retorno ${Date.now()}`,
        unitPriceInCents: 100,
        description: 'X',
        isCommercial: false,
      });

      const id = await sut.save(entity);

      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);

      const row = await prisma.service.findUnique({ where: { id } });
      expect(row?.id).toBe(id);
    });
  });

  describe('findById', () => {
    it('should return null when service does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return entity loaded from services table', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const created = await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          companies: { connect: [{ id: fk.companyId }] },
          name: 'Find by id',
          unitPriceInCents: 777,
          description: 'Y',
          isCommercial: false,
          active: false,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props).toEqual<ServiceCatalogProps>({
        id: created.id,
        cnaeNbsIndopId: fk.cnaeNbsIndopId,
        serviceBilledId: fk.serviceBilledId,
        serviceCategoryId: fk.serviceCategoryId,
        serviceDeliveryTermId: fk.serviceDeliveryTermId,
        serviceFreightId: fk.serviceFreightId,
        serviceProposalValidityId: fk.serviceProposalValidityId,
        serviceWarrantyId: fk.serviceWarrantyId,
        companyIds: [fk.companyId],
        name: 'Find by id',
        unitPriceInCents: 777,
        description: 'Y',
        isCommercial: false,
        active: false,
      });
    });
  });

  describe('edit', () => {
    it('should update row in services table', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const created = await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          companies: { connect: [{ id: fk.companyId }] },
          name: `Original ${Date.now()}`,
          unitPriceInCents: 1000,
          description: 'Original desc',
          isCommercial: true,
          active: true,
        },
      });

      const entity = ServiceCatalogFactory.edit({
        id: created.id,
        ...serviceFkScalars(fk),
        companyIds: [fk.companyId],
        name: 'Serviço atualizado',
        unitPriceInCents: 2000,
        description: 'Nova descrição',
        isCommercial: false,
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.service.findUnique({ where: { id: created.id } });
      expect(updated).toEqual({
        ...created,
        name: 'Serviço atualizado',
        unitPriceInCents: 2000,
        description: 'Nova descrição',
        isCommercial: false,
        active: false,
        updatedAt: updated!.updatedAt,
      });
    });
  });

  describe('delete', () => {
    it('should remove service from services table', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const created = await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          companies: { connect: [{ id: fk.companyId }] },
          name: `Delete ${Date.now()}`,
          unitPriceInCents: 1,
          description: 'Z',
          isCommercial: true,
          active: true,
        },
      });

      await sut.delete(created.id);

      const deleted = await prisma.service.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });
  });
});
