import { Test } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EditCompanyInputDto } from './dtos/edit-company.dto';
import { EditCompany } from './edit-company.service';

function makeCompanyData(overrides?: Partial<{
  name: string;
  fantasyName: string;
  document: string;
  ie: string | null;
  active: boolean;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  phone01: string;
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

describe('EditCompany - Integration tests', () => {
  let sut: EditCompany;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyModule],
    }).compile();

    sut = module.get(EditCompany);
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
    const data: EditCompanyInputDto = { name: 'Updated Name' };

    await expect(sut.execute(999999, data)).rejects.toThrow(CompanyNotFoundError);
    await expect(sut.execute(999999, data)).rejects.toThrow('Empresa não encontrada na base de dados.');
  });

  it('should update company and persist in database', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ name: 'Empresa Original' }),
    });

    const result = await sut.execute(company.id, { name: 'Empresa Atualizada' });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.name).toBe('Empresa Atualizada');
    expect(updated?.document).toBe('09748165000110');
  });

  it('should return success message', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData(),
    });

    const result = await sut.execute(company.id, { fantasyName: 'Nova Fantasia' });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should throw DocumentAlreadyTakenError when document is taken by another company', async() => {
    await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'empresa1@test.com' }),
    });

    const company2 = await prisma.company.create({
      data: makeCompanyData({ document: '33000167000101', email01: 'empresa2@test.com' }),
    });

    await expect(sut.execute(company2.id, { document: '09.748.165/0001-10' })).rejects.toThrow(DocumentAlreadyTakenError);
    await expect(sut.execute(company2.id, { document: '09.748.165/0001-10' })).rejects.toThrow('O documento 09748165000110 já está em uso.');
  });

  it('should allow keeping same document when editing own company', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ name: 'Empresa Original' }),
    });

    const result = await sut.execute(company.id, {
      name: 'Empresa Atualizada',
      document: '09.748.165/0001-10',
    });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.name).toBe('Empresa Atualizada');
    expect(updated?.document).toBe('09748165000110');
  });

  it('should update multiple fields at once', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData(),
    });

    await sut.execute(company.id, {
      name: 'Nova Empresa LTDA',
      fantasyName: 'Nova Fantasia',
      street: 'Av Brasil',
      number: '500',
      city: 'Rio de Janeiro',
      state: 'RJ',
      email01: 'novo@empresa.com',
    });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.name).toBe('Nova Empresa LTDA');
    expect(updated?.fantasyName).toBe('Nova Fantasia');
    expect(updated?.street).toBe('Av Brasil');
    expect(updated?.number).toBe('500');
    expect(updated?.city).toBe('Rio de Janeiro');
    expect(updated?.state).toBe('RJ');
    expect(updated?.email01).toBe('novo@empresa.com');
    expect(updated?.document).toBe('09748165000110');
  });

  it('should update optional fields', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ ie: null, complement: null, phone02: null, cellphone: null, email02: null }),
    });

    await sut.execute(company.id, {
      ie: '123456789',
      complement: 'Sala 10',
      phone02: '1144445555',
      cellphone: '11999998888',
      email02: 'vendas@empresa.com',
    });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.ie).toBe('123456789');
    expect(updated?.complement).toBe('Sala 10');
    expect(updated?.phone02).toBe('1144445555');
    expect(updated?.cellphone).toBe('11999998888');
    expect(updated?.email02).toBe('vendas@empresa.com');
  });

  it('should update address fields', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData(),
    });

    await sut.execute(company.id, {
      zipCode: '20040020',
      street: 'Av Rio Branco',
      number: '156',
      complement: 'Andar 5',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.zipCode).toBe('20040020');
    expect(updated?.street).toBe('Av Rio Branco');
    expect(updated?.number).toBe('156');
    expect(updated?.complement).toBe('Andar 5');
    expect(updated?.neighborhood).toBe('Centro');
    expect(updated?.city).toBe('Rio de Janeiro');
    expect(updated?.state).toBe('RJ');
  });

  it('should update document to new valid CNPJ', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'original@empresa.com' }),
    });

    await sut.execute(company.id, { document: '33.000.167/0001-01' });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.document).toBe('33000167000101');
  });

  it('should not persist when document validation fails', async() => {
    await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'empresa1@test.com' }),
    });

    const company2 = await prisma.company.create({
      data: makeCompanyData({ document: '33000167000101', email01: 'empresa2@test.com', name: 'Empresa 2' }),
    });

    await expect(sut.execute(company2.id, { document: '09.748.165/0001-10', name: 'Nome Tentativa' })).rejects.toThrow(
      DocumentAlreadyTakenError,
    );

    const updated = await prisma.company.findUnique({ where: { id: company2.id } });
    expect(updated?.name).toBe('Empresa 2');
    expect(updated?.document).toBe('33000167000101');
  });

  it('should accept empty partial update', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ name: 'Empresa Original' }),
    });

    const result = await sut.execute(company.id, {});

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.name).toBe('Empresa Original');
  });

  it('should normalize document format when updating', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'contato@empresa.com' }),
    });

    await sut.execute(company.id, { document: '09.748.165/0001-10' });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.document).toBe('09748165000110');
  });
});
