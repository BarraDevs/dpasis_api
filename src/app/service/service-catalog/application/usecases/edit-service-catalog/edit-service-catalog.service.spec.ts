import { Test } from '@nestjs/testing';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { ServiceCategoryNotFoundError } from 'src/app/service/service-category/domain/errors/service-category-not-found.error';
import { ServiceDeliveryTermNotFoundError } from 'src/app/service/service-delivery-term/domain/errors/service-delivery-term-not-found.error';
import { ServiceFreightNotFoundError } from 'src/app/service/service-freight/domain/errors/service-freight-not-found.error';
import { ServiceProposalValidityNotFoundError } from 'src/app/service/service-proposal-validity/domain/errors/service-proposal-validity-not-found.error';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { ServiceWarrantyNotFoundError } from 'src/app/service/service-warranty/domain/errors/service-warranty-not-found.error';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { CnaeNbsIndopNotFoundError } from 'src/app/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditServiceCatalog } from './edit-service-catalog.service';

describe('EditServiceCatalog - Integration tests', () => {
  let sut: EditServiceCatalog;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCatalogModule],
    }).compile();

    sut = module.get(EditServiceCatalog);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ServiceCatalogNotFoundError when service does not exist', async() => {
    await expect(sut.execute(0, { name: 'X' })).rejects.toThrow(ServiceCatalogNotFoundError);
  });

  it('should not validate foreign keys when body omits all FK fields', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...fk,
        name: `Original ${Date.now()}`,
        unitPriceInCents: 1000,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await prisma.cnaeNbsIndop.update({ where: { id: fk.cnaeNbsIndopId }, data: { active: false } });

    await expect(
      sut.execute(created.id, { name: 'Só nome' }),
    ).resolves.toEqual({ message: 'Edição realizada com sucesso' });

    const row = await prisma.service.findUnique({ where: { id: created.id } });
    expect(row?.name).toBe('Só nome');
    expect(row?.cnaeNbsIndopId).toBe(fk.cnaeNbsIndopId);
  });

  it('should throw CnaeNbsIndopNotFoundError when cnaeNbsIndopId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.cnaeNbsIndop.update({ where: { id: fkAlt.cnaeNbsIndopId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { cnaeNbsIndopId: fkAlt.cnaeNbsIndopId }),
    ).rejects.toThrow(CnaeNbsIndopNotFoundError);
  });

  it('should throw ServiceBilledNotFoundError when serviceBilledId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceBilled.update({ where: { id: fkAlt.serviceBilledId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { serviceBilledId: fkAlt.serviceBilledId }),
    ).rejects.toThrow(ServiceBilledNotFoundError);
  });

  it('should throw ServiceCategoryNotFoundError when serviceCategoryId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceCategory.update({ where: { id: fkAlt.serviceCategoryId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { serviceCategoryId: fkAlt.serviceCategoryId }),
    ).rejects.toThrow(ServiceCategoryNotFoundError);
  });

  it('should throw ServiceDeliveryTermNotFoundError when serviceDeliveryTermId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceDeliveryTerm.update({ where: { id: fkAlt.serviceDeliveryTermId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { serviceDeliveryTermId: fkAlt.serviceDeliveryTermId }),
    ).rejects.toThrow(ServiceDeliveryTermNotFoundError);
  });

  it('should throw ServiceFreightNotFoundError when serviceFreightId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceFreight.update({ where: { id: fkAlt.serviceFreightId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { serviceFreightId: fkAlt.serviceFreightId }),
    ).rejects.toThrow(ServiceFreightNotFoundError);
  });

  it('should throw ServiceProposalValidityNotFoundError when serviceProposalValidityId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceProposalValidity.update({ where: { id: fkAlt.serviceProposalValidityId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { serviceProposalValidityId: fkAlt.serviceProposalValidityId }),
    ).rejects.toThrow(ServiceProposalValidityNotFoundError);
  });

  it('should throw ServiceWarrantyNotFoundError when serviceWarrantyId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceWarranty.update({ where: { id: fkAlt.serviceWarrantyId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { serviceWarrantyId: fkAlt.serviceWarrantyId }),
    ).rejects.toThrow(ServiceWarrantyNotFoundError);
  });

  it('should persist FK change when informed id is active', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);

    const created = await prisma.service.create({
      data: {
        ...fkService,
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await sut.execute(created.id, { cnaeNbsIndopId: fkAlt.cnaeNbsIndopId });

    const row = await prisma.service.findUnique({ where: { id: created.id } });
    expect(row?.cnaeNbsIndopId).toBe(fkAlt.cnaeNbsIndopId);
  });
});
