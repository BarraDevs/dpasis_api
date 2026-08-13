import { Prisma } from '@prisma/client';

let companyFixtureDocSeq = 100_000_000_000_00;

/** Document único numérico para Company nos testes (14 dígitos). */
export function nextCompanyFixtureDocument(): string {
  companyFixtureDocSeq += 1;
  return companyFixtureDocSeq.toString().padStart(14, '0');
}

/**
 * Dados mínimos para criar uma Company em testes de integração (document único).
 */
export function buildMinimalCompanyData(
  overrides: Partial<Prisma.CompanyCreateInput> = {},
): Prisma.CompanyCreateInput {
  const suffix = String(Date.now()).slice(-6);
  return {
    name: `Empresa ${suffix}`,
    fantasyName: `Fantasia ${suffix}`,
    document: nextCompanyFixtureDocument(),
    ie: null,
    active: true,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone01: '11999999999',
    phone02: null,
    cellphone: null,
    email01: `empresa${suffix}@test.com`,
    email02: null,
    ...overrides,
  };
}
