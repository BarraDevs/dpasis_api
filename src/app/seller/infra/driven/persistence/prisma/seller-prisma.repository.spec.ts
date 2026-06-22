import { Test } from '@nestjs/testing';
import { SellerFactory } from 'src/app/seller/domain/factories/seller.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerRepositoryAdapterPrisma } from './seller-prisma.repository';

function makeValidCreateProps() {
  return {
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
  };
}

describe('SellerRepositoryAdapterPrisma - Integration tests', () => {
  let sut: SellerRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [SellerRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(SellerRepositoryAdapterPrisma);
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
    it('should persist seller and return created id', async() => {
      const entity = SellerFactory.create(makeValidCreateProps());

      const id = await sut.save(entity);

      expect(id).toBeGreaterThan(0);

      const saved = await prisma.seller.findFirst({
        where: { email: 'joao@vendedor.com' },
      });

      expect(saved?.name).toBe('João Silva');
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update seller in database', async() => {
      const id = await sut.save(SellerFactory.create(makeValidCreateProps()));

      const entity = await sut.findById(id);
      entity!.deactivate();
      await sut.edit(entity!);

      const updated = await prisma.seller.findUnique({ where: { id } });
      expect(updated?.active).toBe(false);
    });
  });

  describe('findById', () => {
    it('should rehydrate seller entity', async() => {
      const id = await sut.save(SellerFactory.create(makeValidCreateProps()));

      const entity = await sut.findById(id);

      expect(entity).not.toBeNull();
      expect(entity?.props.name).toBe('João Silva');
    });

    it('should return null when not found', async() => {
      const entity = await sut.findById(999);

      expect(entity).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove seller from database', async() => {
      const id = await sut.save(SellerFactory.create(makeValidCreateProps()));

      await sut.delete(id);

      const deleted = await prisma.seller.findUnique({ where: { id } });
      expect(deleted).toBeNull();
    });
  });
});
