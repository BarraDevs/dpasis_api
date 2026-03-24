import { Test } from '@nestjs/testing';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { ServiceCategoryNotFoundError } from 'src/app/service/service-category/domain/errors/service-category-not-found.error';
import { ServiceDeliveryTermNotFoundError } from 'src/app/service/service-delivery-term/domain/errors/service-delivery-term-not-found.error';
import { ServiceFreightNotFoundError } from 'src/app/service/service-freight/domain/errors/service-freight-not-found.error';
import { ServiceProposalValidityNotFoundError } from 'src/app/service/service-proposal-validity/domain/errors/service-proposal-validity-not-found.error';
import { ServiceWarrantyNotFoundError } from 'src/app/service/service-warranty/domain/errors/service-warranty-not-found.error';
import {
  seedServiceCatalogForeignKeys,
  serviceFkScalars,
  type ServiceCatalogFkIds,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { CnaeNbsIndopNotFoundError } from 'src/app/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateServiceCatalog } from './create-service-catalog.service';
import { CreateServiceCatalogInputDto } from './dtos/create-service-catalog.dto';

function makeCreateInput(fk: ServiceCatalogFkIds): CreateServiceCatalogInputDto {
  return {
    ...serviceFkScalars(fk),
    companyIds: [fk.companyId],
    name: 'Serviço catálogo integração',
    unitPriceInCents: 1000,
    description: 'Descrição do serviço para teste',
    isCommercial: true,
  };
}

describe('CreateServiceCatalog - Integration tests', () => {
  let sut: CreateServiceCatalog;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCatalogModule],
    }).compile();

    sut = module.get(CreateServiceCatalog);
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

  it('should throw CnaeNbsIndopNotFoundError when cnaeNbsIndop is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.cnaeNbsIndop.update({ where: { id: fk.cnaeNbsIndopId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(CnaeNbsIndopNotFoundError);
  });

  it('should throw ServiceBilledNotFoundError when service billed is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceBilled.update({ where: { id: fk.serviceBilledId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(ServiceBilledNotFoundError);
  });

  it('should throw ServiceCategoryNotFoundError when service category is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceCategory.update({ where: { id: fk.serviceCategoryId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(ServiceCategoryNotFoundError);
  });

  it('should throw ServiceDeliveryTermNotFoundError when service delivery term is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceDeliveryTerm.update({ where: { id: fk.serviceDeliveryTermId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(ServiceDeliveryTermNotFoundError);
  });

  it('should throw ServiceFreightNotFoundError when service freight is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceFreight.update({ where: { id: fk.serviceFreightId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(ServiceFreightNotFoundError);
  });

  it('should throw ServiceProposalValidityNotFoundError when service proposal validity is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceProposalValidity.update({ where: { id: fk.serviceProposalValidityId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(ServiceProposalValidityNotFoundError);
  });

  it('should throw ServiceWarrantyNotFoundError when service warranty is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.serviceWarranty.update({ where: { id: fk.serviceWarrantyId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(ServiceWarrantyNotFoundError);
  });

  it('should throw CompanyNotFoundError when a company is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.company.update({ where: { id: fk.companyId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(CompanyNotFoundError);
  });

  it('should persist service when all foreign keys are active', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);

    const result = await sut.execute(makeCreateInput(fk));

    expect(result.id).toBeDefined();
    const row = await prisma.service.findUnique({ where: { id: result.id } });
    expect(row).not.toBeNull();
    expect(row?.cnaeNbsIndopId).toBe(fk.cnaeNbsIndopId);
    expect(row?.serviceBilledId).toBe(fk.serviceBilledId);
    expect(row?.serviceCategoryId).toBe(fk.serviceCategoryId);
    expect(row?.serviceDeliveryTermId).toBe(fk.serviceDeliveryTermId);
    expect(row?.serviceFreightId).toBe(fk.serviceFreightId);
    expect(row?.serviceProposalValidityId).toBe(fk.serviceProposalValidityId);
    expect(row?.serviceWarrantyId).toBe(fk.serviceWarrantyId);
    expect(row?.name).toBe('Serviço catálogo integração');
    const linked = await prisma.service.findUnique({
      where: { id: result.id },
      include: { companies: true },
    });
    expect(linked?.companies).toHaveLength(1);
    expect(linked?.companies[0].id).toBe(fk.companyId);
  });
});
