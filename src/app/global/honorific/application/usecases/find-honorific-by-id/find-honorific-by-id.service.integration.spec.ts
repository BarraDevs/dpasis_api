import { Test } from '@nestjs/testing';
import { HonorificNotFoundError } from 'src/app/global/honorific/domain/errors/honorific-not-found.error';
import { HonorificModule } from 'src/app/global/honorific/honorific.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindHonorificById } from './find-honorific-by-id.service';

describe('FindHonorificById - Integration tests', () => {
  let sut: FindHonorificById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [HonorificModule],
    }).compile();

    sut = module.get(FindHonorificById);
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

  it('should return row', async() => {
    const row = await prisma.honorific.create({ data: { name: 'Dr.' } });

    const result = await sut.execute(row.id);

    expect(result.id).toBe(row.id);
    expect(result.name).toBe('Dr.');
  });

  it('should throw when missing', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(HonorificNotFoundError);
  });

  it('should throw when inactive and onlyActive is true', async() => {
    const row = await prisma.honorific.create({
      data: { name: `Inact-${Date.now()}`, active: false },
    });

    await expect(sut.execute(row.id, { onlyActive: true })).rejects.toThrow(HonorificNotFoundError);
  });

  it('should return inactive row when onlyActive is not requested', async() => {
    const row = await prisma.honorific.create({
      data: { name: `Silent-${Date.now()}`, active: false },
    });

    const result = await sut.execute(row.id);

    expect(result.active).toBe(false);
  });
});
