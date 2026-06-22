import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerDaoAdapterPrisma } from './seller-prisma.dao';

describe('SellerDaoAdapterPrisma - Integration tests', () => {
  let sut: SellerDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [SellerDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(SellerDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function seedSeller(overrides: Record<string, unknown> = {}) {
    return prisma.seller.create({
      data: {
        name: 'João Silva',
        phone: '1133334444',
        nickname: 'João',
        whatsapp: '11999998888',
        email: 'joao@vendedor.com',
        commission: 10,
        profilePictureUrl: null,
        observation: null,
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

  describe('findById', () => {
    it('should return seller dto when found', async() => {
      const created = await seedSeller();

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('João Silva');
      expect(result?.email).toBe('joao@vendedor.com');
    });

    it('should return null when not found', async() => {
      const result = await sut.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find seller by email case-insensitive', async() => {
      await seedSeller({ email: 'joao@vendedor.com' });

      const result = await sut.findByEmail('JOAO@VENDEDOR.COM');

      expect(result).not.toBeNull();
      expect(result?.id).toBeGreaterThan(0);
    });

    it('should return null when email not found', async() => {
      const result = await sut.findByEmail('missing@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return sellers with pagination', async() => {
      await seedSeller();
      await seedSeller({
        name: 'Maria Santos',
        email: 'maria@vendedor.com',
        phone: '1144445555',
        whatsapp: '11888887777',
      });

      const [rows, total] = await sut.findAll({ page: 1, size: 10 });

      expect(total).toBe(2);
      expect(rows).toHaveLength(2);
    });

    it('should filter by active', async() => {
      await seedSeller({ active: true });
      await seedSeller({
        name: 'Maria Santos',
        email: 'maria@vendedor.com',
        phone: '1144445555',
        whatsapp: '11888887777',
        active: false,
      });

      const [rows, total] = await sut.findAll({ page: 1, size: 10, active: true });

      expect(total).toBe(1);
      expect(rows[0].active).toBe(true);
    });

    it('should search by name', async() => {
      await seedSeller();
      await seedSeller({
        name: 'Maria Santos',
        email: 'maria@vendedor.com',
        phone: '1144445555',
        whatsapp: '11888887777',
      });

      const [rows, total] = await sut.findAll({ page: 1, size: 10, search: 'maria' });

      expect(total).toBe(1);
      expect(rows[0].name).toBe('Maria Santos');
    });
  });
});
