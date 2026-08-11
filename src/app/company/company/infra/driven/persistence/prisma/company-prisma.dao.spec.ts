import { Test } from '@nestjs/testing';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDaoAdapterPrisma } from './company-prisma.dao';

describe('CompanyDaoAdapterPrisma - Integration tests', () => {
  let sut: CompanyDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CompanyDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CompanyDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no companies exist', async() => {
      const [companies, total] = await sut.findAll({});

      expect(companies).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return companies saved with correct format', async() => {
      const created = await prisma.company.create({
        data: {
          name: 'Empresa LTDA',
          fantasyName: 'Empresa',
          document: '09748165000110',
          ie: '123456789',
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
        },
      });

      const [companies, total] = await sut.findAll({});

      expect(companies).toHaveLength(1);
      expect(total).toBe(1);
      expect(companies[0]).toMatchObject<Partial<CompanyDto>>({
        id: created.id,
        name: 'Empresa LTDA',
        fantasyName: 'Empresa',
        document: '09748165000110',
        ie: '123456789',
        active: true,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '1133334444',
        email01: 'contato@empresa.com',
      });
      expect(companies[0]).toHaveProperty('createdAt');
      expect(companies[0]).toHaveProperty('updatedAt');
      expect(companies[0].createdAt).toBeInstanceOf(Date);
      expect(companies[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should filter by active when provided', async() => {
      await prisma.company.create({
        data: {
          name: 'Empresa Ativa',
          fantasyName: 'Ativa',
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
          email01: 'contato@ativa.com',
          email02: null,
        },
      });
      await prisma.company.create({
        data: {
          name: 'Empresa Inativa',
          fantasyName: 'Inativa',
          document: '09748165000111',
          ie: null,
          active: false,
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
          email01: 'contato@inativa.com',
          email02: null,
        },
      });

      const [activeCompanies, activeTotal] = await sut.findAll({ active: true });
      const [inactiveCompanies, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeCompanies).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeCompanies[0].active).toBe(true);
      expect(inactiveCompanies).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveCompanies[0].active).toBe(false);
    });

    it('should paginate results correctly', async() => {
      await prisma.company.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Empresa ${i + 1}`,
          fantasyName: `Empresa ${i + 1}`,
          document: `097481650001${String(i).padStart(2, '0')}`,
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
          email01: `contato${i}@empresa.com`,
          email02: null,
        })),
      });

      const [page1, total] = await sut.findAll({ page: 1, size: 10 });
      const [page2] = await sut.findAll({ page: 2, size: 10 });
      const [page3] = await sut.findAll({ page: 3, size: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);
      expect(total).toBe(25);
    });

    it('should search in name field (case-insensitive)', async() => {
      await prisma.company.create({
        data: {
          name: 'Empresa Premium',
          fantasyName: 'Premium',
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
          email01: 'premium@empresa.com',
          email02: null,
        },
      });
      await prisma.company.create({
        data: {
          name: 'Empresa Básica',
          fantasyName: 'Básica',
          document: '33000167000101',
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
          email01: 'basica@empresa.com',
          email02: null,
        },
      });

      const [companies, total] = await sut.findAll({ search: 'premium' });

      expect(companies).toHaveLength(1);
      expect(total).toBe(1);
      expect(companies[0].name).toBe('Empresa Premium');
    });

    it('should search in fantasyName field', async() => {
      await prisma.company.create({
        data: {
          name: 'Empresa A',
          fantasyName: 'Tech Solutions',
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
          email01: 'a@empresa.com',
          email02: null,
        },
      });

      const [companies, total] = await sut.findAll({ search: 'tech' });

      expect(companies).toHaveLength(1);
      expect(companies[0].fantasyName).toBe('Tech Solutions');
      expect(total).toBe(1);
    });

    it('should search in document field', async() => {
      await prisma.company.create({
        data: {
          name: 'Empresa B',
          fantasyName: 'B',
          document: '33000167000101',
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
          email01: 'b@empresa.com',
          email02: null,
        },
      });

      const [companies, total] = await sut.findAll({ search: '33000167' });

      expect(companies).toHaveLength(1);
      expect(companies[0].document).toBe('33000167000101');
      expect(total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return null when company does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return company by id with correct format', async() => {
      const created = await prisma.company.create({
        data: {
          name: 'Empresa Test',
          fantasyName: 'Test',
          document: '09748165000110',
          ie: '123456789',
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
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Empresa Test');
      expect(result?.document).toBe('09748165000110');
    });
  });

  describe('findByDocument', () => {
    it('should return null when company with document does not exist', async() => {
      const result = await sut.findByDocument('09748165000110');

      expect(result).toBeNull();
    });

    it('should return company by document with correct format', async() => {
      const created = await prisma.company.create({
        data: {
          name: 'Empresa Test',
          fantasyName: 'Test',
          document: '09748165000110',
          ie: '123456789',
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
        },
      });

      const result = await sut.findByDocument('09748165000110');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.document).toBe('09748165000110');
    });
  });
});
