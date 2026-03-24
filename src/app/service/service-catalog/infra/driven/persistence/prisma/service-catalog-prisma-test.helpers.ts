import { PrismaService } from 'src/infra/database/prisma/prisma.service';

export type ServiceCatalogFkIds = {
  cnaeNbsIndopId: number;
  serviceBilledId: number;
  serviceCategoryId: number;
  serviceDeliveryTermId: number;
  serviceFreightId: number;
  serviceProposalValidityId: number;
  serviceWarrantyId: number;
};

/** FKs válidas para inserir em `services` (Cnae/Nbs/Indop têm code VarChar(20)). */
export async function seedServiceCatalogForeignKeys(prisma: PrismaService): Promise<ServiceCatalogFkIds> {
  const unique = `${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
  const [cnae, nbs, indop] = await Promise.all([
    prisma.cnae.create({ data: { code: `C${unique}`.slice(0, 20), description: 'CNAE Test', active: true } }),
    prisma.nbs.create({ data: { code: `N${unique}`.slice(0, 20), description: 'NBS Test', active: true } }),
    prisma.indop.create({ data: { code: `I${unique}`.slice(0, 20), description: 'INDOP Test', active: true } }),
  ]);
  const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
    data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
  });
  const [serviceCategory, billed, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
    prisma.serviceCategory.create({ data: { name: `Cat ${unique}`, active: true } }),
    prisma.serviceBilled.create({
      data: { description: `Billed ${unique}`, isJunction: false, installmentDays: [10], active: true },
    }),
    prisma.serviceDeliveryTerm.create({ data: { name: `Term ${unique}`, active: true } }),
    prisma.serviceFreight.create({ data: { name: `Freight ${unique}`, active: true } }),
    prisma.serviceProposalValidity.create({ data: { name: `Validity ${unique}`, active: true } }),
    prisma.serviceWarranty.create({ data: { name: `Warranty ${unique}`, active: true } }),
  ]);

  return {
    cnaeNbsIndopId: cnaeNbsIndop.id,
    serviceBilledId: billed.id,
    serviceCategoryId: serviceCategory.id,
    serviceDeliveryTermId: deliveryTerm.id,
    serviceFreightId: freight.id,
    serviceProposalValidityId: proposalValidity.id,
    serviceWarrantyId: warranty.id,
  };
}
