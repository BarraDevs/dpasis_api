import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateResaleInputDto } from './create-resale/dtos/create-resale.dto';

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

export function makeCreateResaleInput(overrides: Partial<CreateResaleInputDto> = {}): CreateResaleInputDto {
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
    ...overrides,
  };
}
