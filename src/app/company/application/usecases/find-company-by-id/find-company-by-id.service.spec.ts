import { Test } from '@nestjs/testing';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyModule } from '../../../company.module';
import { FindCompanyById } from './find-company-by-id.service';

function makeCompanyData(overrides?: Partial<{
  name: string;
  fantasyName: string;
  document: string;
  ie: string | null;
  active: boolean;
  complement: string | null;
  phone02: string | null;
  cellphone: string | null;
  email01: string;
  email02: string | null;
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

describe('FindCompanyById - Integration tests', () => {
  let sut: FindCompanyById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyModule],
    }).compile();

    sut = module.get(FindCompanyById);
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

  it('should throw CompanyNotFoundError when onlyActive is true and company is inactive', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ active: false, email01: 'inativa@empresa.com' }),
    });

    await expect(sut.execute(company.id, { onlyActive: true })).rejects.toThrow(CompanyNotFoundError);
    await expect(sut.execute(company.id, { onlyActive: true })).rejects.toThrow('Empresa não encontrada na base de dados.');
  });

  it('should return company when onlyActive is true and company is active', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ name: 'Empresa Ativa', active: true, email01: 'ativa@empresa.com' }),
    });

    const result = await sut.execute(company.id, { onlyActive: true });

    expect(result).not.toBeNull();
    expect(result.id).toBe(company.id);
    expect(result.active).toBe(true);
    expect(result.name).toBe('Empresa Ativa');
  });

  it('should return company by id when onlyActive is false (default)', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ name: 'Empresa Inativa', active: false, email01: 'inativa@empresa.com' }),
    });

    const result = await sut.execute(company.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(company.id);
    expect(result.active).toBe(false);
    expect(result.name).toBe('Empresa Inativa');
  });

  it('should return company by id when onlyActive is explicitly false', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ active: false, email01: 'inativa@empresa.com' }),
    });

    const result = await sut.execute(company.id, { onlyActive: false });

    expect(result).not.toBeNull();
    expect(result.id).toBe(company.id);
    expect(result.active).toBe(false);
  });

  it('should return company data with all fields', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({
        name: 'Empresa Completa',
        fantasyName: 'Completa',
        document: '09748165000110',
        ie: '123456789',
        active: true,
        complement: 'Sala 1',
        phone02: '1144445555',
        cellphone: '11999998888',
        email02: 'vendas@empresa.com',
        email01: 'contato@empresa.com',
      }),
    });

    const result = await sut.execute(company.id);

    expect(result).toEqual({
      id: company.id,
      name: 'Empresa Completa',
      fantasyName: 'Completa',
      document: '09748165000110',
      ie: '123456789',
      active: true,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: 'Sala 1',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      phone01: '1133334444',
      phone02: '1144445555',
      cellphone: '11999998888',
      email01: 'contato@empresa.com',
      email02: 'vendas@empresa.com',
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    });
  });

  it('should return active company when onlyActive is false regardless of status', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ active: true, email01: 'ativa@empresa.com' }),
    });

    const result = await sut.execute(company.id, { onlyActive: false });

    expect(result.active).toBe(true);
    expect(result.id).toBe(company.id);
  });

  it('should not return inactive company when onlyActive is true', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ active: false, document: '33000167000101', email01: 'inativa@empresa.com' }),
    });

    await expect(sut.execute(company.id, { onlyActive: true })).rejects.toThrow(CompanyNotFoundError);

    const resultWithoutFilter = await sut.execute(company.id);
    expect(resultWithoutFilter.active).toBe(false);
  });
});
