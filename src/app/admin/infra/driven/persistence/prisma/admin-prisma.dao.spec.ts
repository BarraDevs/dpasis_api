import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AdminDaoAdapterPrisma } from './admin-prisma.dao';

describe('AdminDaoAdapterPrisma - Integration tests', () => {
  let sut: AdminDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AdminDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(AdminDaoAdapterPrisma);
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
    it('should return empty array when no admins exist', async() => {
      const [rows, total] = await sut.findAll({});

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });
  });
});
