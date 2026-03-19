import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyModule } from '../../../company.module';
import { FindAllCompany } from './find-all-company.service';

function makeCompanyData(overrides?: Partial<{
  name: string;
  fantasyName: string;
  document: string;
  email01: string;
  active: boolean;
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

describe('FindAllCompany - Integration tests', () => {
  let sut: FindAllCompany;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyModule],
    }).compile();

    sut = module.get(FindAllCompany);
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

  it('should return empty pagination when no companies exist', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(0);
  });

  it('should return companies with default pagination', async() => {
    await prisma.company.createMany({
      data: [
        makeCompanyData({ document: '09748165000110', email01: 'empresa1@test.com' }),
        makeCompanyData({ document: '33000167000101', email01: 'empresa2@test.com' }),
      ],
    });

    const result = await sut.execute({});

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.currentPage).toBe(1);
  });

  it('should paginate results correctly', async() => {
    await prisma.company.createMany({
      data: Array.from({ length: 25 }, (_, i) =>
        makeCompanyData({
          document: `097481650001${String(i).padStart(2, '0')}`,
          email01: `empresa${i}@test.com`,
        }),
      ),
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
  });

  it('should return correct page when requesting page 2', async() => {
    await prisma.company.createMany({
      data: Array.from({ length: 25 }, (_, i) =>
        makeCompanyData({
          document: `097481650001${String(i).padStart(2, '0')}`,
          email01: `empresa${i}@test.com`,
        }),
      ),
    });

    const result = await sut.execute({ page: 2, size: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.currentPage).toBe(2);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should return last page with remaining items', async() => {
    await prisma.company.createMany({
      data: Array.from({ length: 25 }, (_, i) =>
        makeCompanyData({
          document: `097481650001${String(i).padStart(2, '0')}`,
          email01: `empresa${i}@test.com`,
        }),
      ),
    });

    const result = await sut.execute({ page: 3, size: 10 });

    expect(result.data).toHaveLength(5);
    expect(result.currentPage).toBe(3);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should return company data with all fields', async() => {
    const company = await prisma.company.create({
      data: makeCompanyData({
        name: 'Empresa LTDA',
        fantasyName: 'Empresa',
        document: '09748165000110',
        email01: 'contato@empresa.com',
      }),
    });

    const result = await sut.execute({});

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: company.id,
      name: 'Empresa LTDA',
      fantasyName: 'Empresa',
      document: '09748165000110',
      active: true,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      city: 'São Paulo',
      state: 'SP',
      email01: 'contato@empresa.com',
    });
    expect(result.data[0]).toHaveProperty('createdAt');
    expect(result.data[0]).toHaveProperty('updatedAt');
  });

  it('should filter by active when active is true', async() => {
    await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'a@test.com', active: true }),
    });
    await prisma.company.create({
      data: makeCompanyData({ document: '33000167000101', email01: 'b@test.com', active: false }),
    });
    await prisma.company.create({
      data: makeCompanyData({ document: '07526557000162', email01: 'c@test.com', active: true }),
    });

    const result = await sut.execute({ active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c) => c.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'a@test.com', active: true }),
    });
    await prisma.company.create({
      data: makeCompanyData({ document: '33000167000101', email01: 'b@test.com', active: false }),
    });
    await prisma.company.create({
      data: makeCompanyData({ document: '07526557000162', email01: 'c@test.com', active: false }),
    });

    const result = await sut.execute({ active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c) => !c.active)).toBe(true);
  });

  it('should filter by search in name (case-insensitive)', async() => {
    await prisma.company.create({
      data: makeCompanyData({ name: 'Empresa Premium', document: '09748165000110', email01: 'premium@test.com' }),
    });
    await prisma.company.create({
      data: makeCompanyData({ name: 'Empresa Básica', document: '33000167000101', email01: 'basica@test.com' }),
    });

    const result = await sut.execute({ search: 'premium' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Empresa Premium');
    expect(result.totalItems).toBe(1);
  });

  it('should filter by search in fantasyName (case-insensitive)', async() => {
    await prisma.company.create({
      data: makeCompanyData({ fantasyName: 'Premium Corp', document: '09748165000110', email01: 'premium@test.com' }),
    });
    await prisma.company.create({
      data: makeCompanyData({ fantasyName: 'Básica', document: '33000167000101', email01: 'basica@test.com' }),
    });

    const result = await sut.execute({ search: 'PREMIUM' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].fantasyName).toBe('Premium Corp');
  });

  it('should filter by search in document (case-insensitive)', async() => {
    await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'empresa1@test.com' }),
    });
    await prisma.company.create({
      data: makeCompanyData({ document: '33000167000101', email01: 'empresa2@test.com' }),
    });

    const result = await sut.execute({ search: '33000167' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].document).toBe('33000167000101');
  });

  it('should return multiple companies when search matches multiple', async() => {
    await prisma.company.create({
      data: makeCompanyData({ name: 'Tech Solutions LTDA', document: '09748165000110', email01: 'tech1@test.com' }),
    });
    await prisma.company.create({
      data: makeCompanyData({ name: 'Tech Innovations', document: '33000167000101', email01: 'tech2@test.com' }),
    });
    await prisma.company.create({
      data: makeCompanyData({ name: 'Outra Empresa', document: '07526557000162', email01: 'outra@test.com' }),
    });

    const result = await sut.execute({ search: 'tech' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
  });

  it('should return empty when search matches no company', async() => {
    await prisma.company.create({
      data: makeCompanyData({ document: '09748165000110', email01: 'empresa@test.com' }),
    });

    const result = await sut.execute({ search: 'Inexistente' });

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should combine pagination and search filter', async() => {
    await prisma.company.createMany({
      data: Array.from({ length: 15 }, (_, i) =>
        makeCompanyData({
          name: `Empresa Premium ${i + 1}`,
          document: `097481650001${String(i).padStart(2, '0')}`,
          email01: `premium${i}@test.com`,
        }),
      ),
    });
    await prisma.company.createMany({
      data: Array.from({ length: 5 }, (_, i) =>
        makeCompanyData({
          name: `Empresa Outra ${i + 1}`,
          document: `330001670001${String(i).padStart(2, '0')}`,
          email01: `outra${i}@test.com`,
        }),
      ),
    });

    const result = await sut.execute({ page: 1, size: 5, search: 'Premium' });

    expect(result.data).toHaveLength(5);
    expect(result.totalItems).toBe(15);
    expect(result.totalPages).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.data.every((c) => c.name.includes('Premium'))).toBe(true);
  });
});
