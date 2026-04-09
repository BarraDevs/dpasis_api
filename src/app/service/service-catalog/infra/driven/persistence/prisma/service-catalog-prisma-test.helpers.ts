import { PrismaService } from 'src/infra/database/prisma/prisma.service';

export type ServiceCatalogFkIds = {
  cnaeNbsIndopId: number;
  billedId: number;
  categoryId: number;
  deliveryTermId: number;
  freightId: number;
  proposalValidityId: number;
  warrantyId: number;
  companyId: number;
};

/** Campos escalares de FK para `Service` (exclui `companyId`, que não é coluna). */
export function serviceFkScalars(fk: ServiceCatalogFkIds): Omit<ServiceCatalogFkIds, 'companyId'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { companyId, ...scalars } = fk;
  return scalars;
}

/** FKs válidas para inserir em `services` (Cnae/Nbs/Indop têm code VarChar(20)). */
export async function seedServiceCatalogForeignKeys(prisma: PrismaService): Promise<ServiceCatalogFkIds> {
  const unique = `${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
  const cnpjDigits = `${Date.now()}${Math.floor(Math.random() * 1e6)}`.replace(/\D/g, '').slice(0, 14).padStart(14, '1');
  const company = await prisma.company.create({
    data: {
      name: `Empresa Test ${unique}`,
      fantasyName: `Fan ${unique}`,
      document: `${cnpjDigits.slice(0, 2)}.${cnpjDigits.slice(2, 5)}.${cnpjDigits.slice(5, 8)}/${cnpjDigits.slice(8, 12)}-${cnpjDigits.slice(12, 14)}`,
      active: true,
      zipCode: '01310-100',
      street: 'Rua Teste',
      number: '1',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      phone01: '1133334444',
      email01: 'test@example.com',
    },
  });
  const [cnae, nbs, indop] = await Promise.all([
    prisma.cnae.create({ data: { code: `C${unique}`.slice(0, 20), description: 'CNAE Test', active: true } }),
    prisma.nbs.create({ data: { code: `N${unique}`.slice(0, 20), description: 'NBS Test', active: true } }),
    prisma.indop.create({ data: { code: `I${unique}`.slice(0, 20), description: 'INDOP Test', active: true } }),
  ]);
  const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
    data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
  });
  const [serviceCategory, billed, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
    prisma.category.create({ data: { name: `Cat ${unique}`, active: true } }),
    prisma.billed.create({
      data: { description: `Billed ${unique}`, isJunction: false, installmentDays: [10], active: true },
    }),
    prisma.deliveryTerm.create({ data: { name: `Term ${unique}`, active: true } }),
    prisma.freight.create({ data: { name: `Freight ${unique}`, active: true } }),
    prisma.proposalValidity.create({ data: { name: `Validity ${unique}`, active: true } }),
    prisma.warranty.create({ data: { name: `Warranty ${unique}`, active: true } }),
  ]);

  return {
    cnaeNbsIndopId: cnaeNbsIndop.id,
    billedId: billed.id,
    categoryId: serviceCategory.id,
    deliveryTermId: deliveryTerm.id,
    freightId: freight.id,
    proposalValidityId: proposalValidity.id,
    warrantyId: warranty.id,
    companyId: company.id,
  };
}
