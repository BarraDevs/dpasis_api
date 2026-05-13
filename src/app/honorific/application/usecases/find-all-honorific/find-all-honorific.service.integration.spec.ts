import { Test } from '@nestjs/testing';
import { HonorificModule } from 'src/app/honorific/honorific.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindAllHonorific } from './find-all-honorific.service';

describe('FindAllHonorific - Integration tests', () => {
  let sut: FindAllHonorific;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [HonorificModule],
    }).compile();

    sut = module.get(FindAllHonorific);
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

  it('should list honorifics', async() => {
    await prisma.honorific.createMany({ data: [{ name: 'Sr.' }, { name: 'Sra.' }] });

    const page = await sut.execute({ page: 1, size: 10 });

    expect(page.totalItems).toBe(2);
    expect(page.data).toHaveLength(2);
  });
});
