import { Test } from '@nestjs/testing';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { HonorificModule } from 'src/app/honorific/honorific.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { UpdateHonorificStatus } from './update-honorific-status.service';

describe('UpdateHonorificStatus - Integration tests', () => {
  let sut: UpdateHonorificStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [HonorificModule],
    }).compile();

    sut = module.get(UpdateHonorificStatus);
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

  it('should invert active flag', async() => {
    const row = await prisma.honorific.create({ data: { name: 'Sr.', active: true } });

    await sut.execute(row.id);

    const updated = await prisma.honorific.findUnique({ where: { id: row.id } });
    expect(updated?.active).toBe(false);
  });

  it('should throw when not found', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(HonorificNotFoundError);
  });
});
