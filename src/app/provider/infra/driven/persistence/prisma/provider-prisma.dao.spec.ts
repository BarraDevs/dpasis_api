import { Test } from '@nestjs/testing';
import { ProviderDto } from 'src/app/provider/application/dtos/provider.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderDaoAdapterPrisma } from './provider-prisma.dao';

describe('ProviderDaoAdapterPrisma - Integration tests', () => {
  let sut: ProviderDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ProviderDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ProviderDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function createProvider(overrides: Record<string, unknown> = {}) {
    return prisma.provider.create({
      data: {
        name: 'Prestador LTDA',
        document: '09748165000110',
        ie: null,
        fantasyName: 'Prestador',
        email: 'contato@prestador.com',
        website: 'https://prestador.com',
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        active: true,
        ...overrides,
      },
    });
  }

  describe('findAll', () => {
    it('should return empty array when no providers exist', async() => {
      const [providers, total] = await sut.findAll({});

      expect(providers).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return providers saved with correct format', async() => {
      const created = await createProvider();

      const [providers, total] = await sut.findAll({});

      expect(providers).toHaveLength(1);
      expect(total).toBe(1);
      expect(providers[0]).toMatchObject<Partial<ProviderDto>>({
        id: created.id,
        name: 'Prestador LTDA',
        document: '09748165000110',
        email: 'contato@prestador.com',
        active: true,
      });
    });

    it('should filter by active when provided', async() => {
      await createProvider({ document: '09748165000110', active: true });
      await createProvider({
        document: '33000167000101',
        email: 'outro@prestador.com',
        active: false,
      });

      const [activeProviders, activeTotal] = await sut.findAll({ active: true });
      const [inactiveProviders, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeTotal).toBe(1);
      expect(activeProviders[0].active).toBe(true);
      expect(inactiveTotal).toBe(1);
      expect(inactiveProviders[0].active).toBe(false);
    });

    it('should search by name, fantasyName, document and email', async() => {
      await createProvider();

      const [byName] = await sut.findAll({ search: 'Prestador' });
      const [byDocument] = await sut.findAll({ search: '09748165000110' });
      const [byEmail] = await sut.findAll({ search: 'contato@prestador.com' });

      expect(byName).toHaveLength(1);
      expect(byDocument).toHaveLength(1);
      expect(byEmail).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return null when provider does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return provider when found', async() => {
      const created = await createProvider();

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('findByDocument', () => {
    it('should find provider by document case-insensitively', async() => {
      await createProvider();

      const result = await sut.findByDocument('09748165000110');

      expect(result).not.toBeNull();
      expect(result?.document).toBe('09748165000110');
    });
  });

  describe('findByEmail', () => {
    it('should find provider by email case-insensitively', async() => {
      await createProvider();

      const result = await sut.findByEmail('CONTATO@PRESTADOR.COM');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('contato@prestador.com');
    });
  });
});
