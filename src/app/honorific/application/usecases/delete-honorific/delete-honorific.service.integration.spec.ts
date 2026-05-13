import { Test } from '@nestjs/testing';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { HonorificModule } from 'src/app/honorific/honorific.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteHonorific } from './delete-honorific.service';

describe('DeleteHonorific - Integration tests', () => {
  let sut: DeleteHonorific;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [HonorificModule],
    }).compile();

    sut = module.get(DeleteHonorific);
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

  it('should delete honorific', async() => {
    const row = await prisma.honorific.create({ data: { name: 'Sr.' } });

    await sut.execute(row.id);

    const gone = await prisma.honorific.findUnique({ where: { id: row.id } });
    expect(gone).toBeNull();
  });

  it('should throw when not found', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(HonorificNotFoundError);
  });
});
