import { Test } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeactivateCompany } from './deactivate-company.service';

function makeCompanyData(overrides?: Partial<{
  active: boolean;
  document: string;
  email01: string;
}>) {
  return {
    name: 'Empresa LTDA',
    fantasyName: 'Empresa',
    document: '09748165000110',
    ie: null,
    active: true,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone01: '1133334444',
    phone02: null,
    cellphone: null,
    email01: 'contato@empresa.com',
    email02: null,
    ...overrides,
  };
}

describe('DeactivateCompany - Integration tests', () => {
  let sut: DeactivateCompany;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyModule],
    }).compile();

    sut = module.get(DeactivateCompany);
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

  it('should throw CompanyNotFoundError when company does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(CompanyNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Empresa não encontrada na base de dados.');
  });

  it('should deactivate company in database', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ active: true }),
    });

    await sut.execute(company.id);

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.active).toBe(false);
  });

  it('should return success message', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ active: true }),
    });

    const result = await sut.execute(company.id);

    expect(result).toEqual({ message: 'Empresa desativada com sucesso' });
  });

  it('should be idempotent when company is already inactive', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ active: false, document: '33000167000101', email01: 'inativa@empresa.com' }),
    });

    const result = await sut.execute(company.id);

    expect(result).toEqual({ message: 'Empresa desativada com sucesso' });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.active).toBe(false);
  });
});
