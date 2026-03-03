import { Test } from '@nestjs/testing';
import { CompanyFactory } from 'src/app/company/company/domain/factories/company.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyRepositoryAdapterPrisma } from './company-prisma.repository';

describe('CompanyRepositoryAdapterPrisma - Integration tests', () => {
  let sut: CompanyRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CompanyRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CompanyRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should persist company and return created id', async() => {
      const entity = CompanyFactory.create({
        name: 'Empresa LTDA',
        fantasyName: 'Empresa',
        document: '09.748.165/0001-10',
        ie: '123456789',
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        complement: 'Sala 1',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '1133334444',
        phone02: null,
        cellphone: null,
        email01: 'contato@empresa.com',
        email02: null,
      });

      const id = await sut.save(entity);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);

      const saved = await prisma.company.findFirst({
        where: { document: '09748165000110' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(id);
      expect(saved?.name).toBe('Empresa LTDA');
      expect(saved?.fantasyName).toBe('Empresa');
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.ie).toBe('123456789');
      expect(saved?.zipCode).toBe('01310100');
      expect(saved?.street).toBe('Av Paulista');
      expect(saved?.number).toBe('1000');
      expect(saved?.complement).toBe('Sala 1');
      expect(saved?.neighborhood).toBe('Bela Vista');
      expect(saved?.city).toBe('São Paulo');
      expect(saved?.state).toBe('SP');
      expect(saved?.phone01).toBe('1133334444');
      expect(saved?.active).toBe(true);
      expect(saved?.email01).toBe('contato@empresa.com');
    });

    it('should persist company with optional fields as null', async() => {
      const entity = CompanyFactory.create({
        name: 'Outra Empresa',
        fantasyName: 'Outra',
        document: '33.000.167/0001-01',
        ie: null,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '2000',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '1133334444',
        phone02: null,
        cellphone: null,
        email01: 'outro@empresa.com',
        email02: null,
      });

      await sut.save(entity);

      const saved = await prisma.company.findFirst({
        where: { document: '33000167000101' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.ie).toBeNull();
      expect(saved?.complement).toBeNull();
      expect(saved?.phone02).toBeNull();
      expect(saved?.cellphone).toBeNull();
      expect(saved?.email02).toBeNull();
    });
  });

  describe('edit', () => {
    it('should update company in database', async() => {
      const entity = CompanyFactory.create({
        name: 'Nome Original',
        fantasyName: 'Original',
        document: '09.748.165/0001-10',
        ie: null,
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
      });

      const id = await sut.save(entity);

      const entityToEdit = CompanyFactory.edit({
        ...entity.props,
        id,
        name: 'Nome Atualizado',
        fantasyName: 'Nova Fantasia',
      });

      await sut.edit(entityToEdit);

      const updated = await prisma.company.findUnique({
        where: { id },
      });

      expect(updated?.name).toBe('Nome Atualizado');
      expect(updated?.fantasyName).toBe('Nova Fantasia');
      expect(updated?.document).toBe('09748165000110');
    });
  });

  describe('findById', () => {
    it('should return null when company does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return company entity when found', async() => {
      const entity = CompanyFactory.create({
        name: 'Empresa Test',
        fantasyName: 'Test',
        document: '09.748.165/0001-10',
        ie: null,
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
      });

      const id = await sut.save(entity);

      const found = await sut.findById(id);

      expect(found).not.toBeNull();
      expect(found?.props.id).toBe(id);
      expect(found?.props.name).toBe('Empresa Test');
      expect(found?.props.document).toBe('09748165000110');
    });
  });
});
