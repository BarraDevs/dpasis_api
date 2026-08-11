import { Test } from '@nestjs/testing';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { BilledNotFoundError } from 'src/app/global/billed/domain/errors/billed-not-found.error';
import { CategoryNotFoundError } from 'src/app/global/category/domain/errors/category-not-found.error';
import { DeliveryTermNotFoundError } from 'src/app/global/delivery-term/domain/errors/delivery-term-not-found.error';
import { FreightNotFoundError } from 'src/app/global/freight/domain/errors/freight-not-found.error';
import { ProposalValidityNotFoundError } from 'src/app/global/proposal-validity/domain/errors/proposal-validity-not-found.error';
import { CnaeNbsIndopNotFoundError } from 'src/app/global/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { WarrantyNotFoundError } from 'src/app/global/warranty/domain/errors/warranty-not-found.error';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import {
  seedServiceCatalogForeignKeys,
  serviceFkScalars,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
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
        ...serviceFkScalars(fk),
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
        ...serviceFkScalars(fkService),
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

  it('should throw BilledNotFoundError when serviceBilledId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.billed.update({ where: { id: fkAlt.billedId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fkService),
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { billedId: fkAlt.billedId }),
    ).rejects.toThrow(BilledNotFoundError);
  });

  it('should throw CategoryNotFoundError when serviceCategoryId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.category.update({ where: { id: fkAlt.categoryId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fkService),
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { categoryId: fkAlt.categoryId }),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  it('should throw DeliveryTermNotFoundError when serviceDeliveryTermId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.deliveryTerm.update({ where: { id: fkAlt.deliveryTermId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fkService),
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { deliveryTermId: fkAlt.deliveryTermId }),
    ).rejects.toThrow(DeliveryTermNotFoundError);
  });

  it('should throw FreightNotFoundError when serviceFreightId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.freight.update({ where: { id: fkAlt.freightId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fkService),
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { freightId: fkAlt.freightId }),
    ).rejects.toThrow(FreightNotFoundError);
  });

  it('should throw ProposalValidityNotFoundError when serviceProposalValidityId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.proposalValidity.update({ where: { id: fkAlt.proposalValidityId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fkService),
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { proposalValidityId: fkAlt.proposalValidityId }),
    ).rejects.toThrow(ProposalValidityNotFoundError);
  });

  it('should throw WarrantyNotFoundError when serviceWarrantyId is informed and inactive', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);
    await prisma.warranty.update({ where: { id: fkAlt.warrantyId }, data: { active: false } });

    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fkService),
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, { warrantyId: fkAlt.warrantyId }),
    ).rejects.toThrow(WarrantyNotFoundError);
  });

  it('should throw CompanyNotFoundError when a company is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        companies: { connect: [{ id: fk.companyId }] },
        name: 'S',
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: true,
      },
    });

    await prisma.company.update({ where: { id: fk.companyId }, data: { active: false } });

    await expect(sut.execute(created.id, { companyIds: [fk.companyId] })).rejects.toThrow(
      CompanyNotFoundError,
    );
  });

  it('should persist FK change when informed id is active', async() => {
    const fkService = await seedServiceCatalogForeignKeys(prisma);
    const fkAlt = await seedServiceCatalogForeignKeys(prisma);

    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fkService),
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
