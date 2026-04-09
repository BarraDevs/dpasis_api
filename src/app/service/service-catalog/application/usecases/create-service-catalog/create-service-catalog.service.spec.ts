import { Test } from '@nestjs/testing';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CnaeNbsIndopNotFoundError } from 'src/app/global/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { BilledNotFoundError } from 'src/app/service/billed/domain/errors/billed-not-found.error';
import { CategoryNotFoundError } from 'src/app/service/category/domain/errors/category-not-found.error';
import { DeliveryTermNotFoundError } from 'src/app/service/delivery-term/domain/errors/delivery-term-not-found.error';
import { FreightNotFoundError } from 'src/app/service/freight/domain/errors/freight-not-found.error';
import { ProposalValidityNotFoundError } from 'src/app/service/proposal-validity/domain/errors/proposal-validity-not-found.error';
import {
  seedServiceCatalogForeignKeys,
  serviceFkScalars,
  type ServiceCatalogFkIds,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { WarrantyNotFoundError } from 'src/app/service/warranty/domain/errors/warranty-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateServiceCatalog } from './create-service-catalog.service';
import { CreateServiceCatalogInputDto } from './dtos/create-service-catalog.dto';

function makeCreateInput(fk: ServiceCatalogFkIds): CreateServiceCatalogInputDto {
  return {
    ...serviceFkScalars(fk),
    billedId: fk.billedId,
    categoryId: fk.categoryId,
    deliveryTermId: fk.deliveryTermId,
    freightId: fk.freightId,
    proposalValidityId: fk.proposalValidityId,
    warrantyId: fk.warrantyId,
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

  it('should throw BilledNotFoundError when billed is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.billed.update({ where: { id: fk.billedId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(BilledNotFoundError);
  });

  it('should throw CategoryNotFoundError when category is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.category.update({ where: { id: fk.categoryId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(CategoryNotFoundError);
  });

  it('should throw DeliveryTermNotFoundError when delivery term is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.deliveryTerm.update({ where: { id: fk.deliveryTermId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(DeliveryTermNotFoundError);
  });

  it('should throw FreightNotFoundError when freight is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.freight.update({ where: { id: fk.freightId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(FreightNotFoundError);
  });

  it('should throw ProposalValidityNotFoundError when proposal validity is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.proposalValidity.update({ where: { id: fk.proposalValidityId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(ProposalValidityNotFoundError);
  });

  it('should throw WarrantyNotFoundError when warranty is inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    await prisma.warranty.update({ where: { id: fk.warrantyId }, data: { active: false } });

    await expect(sut.execute(makeCreateInput(fk))).rejects.toThrow(WarrantyNotFoundError);
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
    expect(row?.billedId).toBe(fk.billedId);
    expect(row?.categoryId).toBe(fk.categoryId);
    expect(row?.deliveryTermId).toBe(fk.deliveryTermId);
    expect(row?.freightId).toBe(fk.freightId);
    expect(row?.proposalValidityId).toBe(fk.proposalValidityId);
    expect(row?.warrantyId).toBe(fk.warrantyId);
    expect(row?.name).toBe('Serviço catálogo integração');
    const linked = await prisma.service.findUnique({
      where: { id: result.id },
      include: { companies: true },
    });
    expect(linked?.companies).toHaveLength(1);
    expect(linked?.companies[0].id).toBe(fk.companyId);
  });
});
