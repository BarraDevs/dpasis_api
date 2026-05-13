import { Prisma } from '@prisma/client';
import { CreateResaleExecuteInputDto } from 'src/app/resale/resale/application/usecases/create-resale/dtos/create-resale.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

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
    servedByRoot: false,
    manufacturerResale: false,
    indicatorResale: false,
    recurringResale: false,
    active: true,
  };
}

let resaleFixtureIdSeq = 879_990;

/** IDs únicos para Resale nos testes (sequência incremental no processo do Jest). */
export function nextResaleFixtureId(): number {
  resaleFixtureIdSeq += 1;
  return resaleFixtureIdSeq;
}

/** Trunca o banco e posiciona a sequência de revenda (testes de integração do módulo resale). */
export async function resetResaleIntegrationState(
  prisma: PrismaService,
  sequenceNextId = 1,
): Promise<void> {
  await prisma.truncate();
  await prisma.resaleSequence.upsert({
    where: { id: 1 },
    create: { id: 1, nextId: sequenceNextId },
    update: { nextId: sequenceNextId },
  });
}

/** Payload válido padrão para `CreateResale` em testes. */
export function makeCreateResaleInput(overrides: Partial<CreateResaleExecuteInputDto> = {}): CreateResaleExecuteInputDto {
  return {
    code: 'REV-001',
    name: 'Revenda Teste',
    identifier: null,
    zipCode: '01310-100',
    street: 'Av Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    licenseType: 'A1',
    document: '09.748.165/0001-10',
    ie: null,
    phone01: '11999999999',
    phone02: null,
    voucher: null,
    email: null,
    website: null,
    nickname: null,
    socialName: null,
    validityDate: null,
    accessEmail: null,
    accessPassword: null,
    paymentDay: null,
    bonus: null,
    billingStartDay: null,
    ...overrides,
  };
}
