import { Test } from '@nestjs/testing';
import { HonorificAlreadyExistsError } from 'src/app/honorific/domain/errors/honorific-already-exists.error';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { HonorificModule } from 'src/app/honorific/honorific.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditHonorific } from './edit-honorific.service';

describe('EditHonorific - Integration tests', () => {
  let sut: EditHonorific;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [HonorificModule],
    }).compile();

    sut = module.get(EditHonorific);
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

  it('should update name', async() => {
    const row = await prisma.honorific.create({ data: { name: 'Sr.' } });

    await sut.execute(row.id, { name: 'Sra.' });

    const updated = await prisma.honorific.findUnique({ where: { id: row.id } });
    expect(updated?.name).toBe('Sra.');
  });

  it('should throw when id not found', async() => {
    await expect(sut.execute(99999, { name: 'X' })).rejects.toThrow(HonorificNotFoundError);
  });

  it('should throw when new name conflicts', async() => {
    await prisma.honorific.create({ data: { name: 'A' } });
    const b = await prisma.honorific.create({ data: { name: 'B' } });

    await expect(sut.execute(b.id, { name: 'A' })).rejects.toThrow(HonorificAlreadyExistsError);
  });
});
