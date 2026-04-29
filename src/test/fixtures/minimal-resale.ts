import { Prisma } from '@prisma/client';

/**
 * Dados mínimos para criar uma Resale em testes de integração (@@id explícito, document único).
 */
export function buildMinimalResaleData(id: number): Prisma.ResaleCreateInput {
  return {
    id,
    name: `Revenda ${id}`,
    identifier: null,
    zipCode: '01310100',
    street: 'Rua Teste',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    licenseType: 'A1',
    document: id.toString().padStart(14, '0'),
    ie: null,
    phone01: '11999999999',
    phone02: null,
    voucher: null,
    email: null,
    website: null,
    receivesSupportEmail: false,
    servedByDpa: false,
    manufacturerReseller: false,
    active: true,
  };
}

let resaleFixtureIdSeq = 879_990;

/** IDs únicos para Resale nos testes (sequência incremental no processo do Jest). */
export function nextResaleFixtureId(): number {
  resaleFixtureIdSeq += 1;
  return resaleFixtureIdSeq;
}
