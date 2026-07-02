import { Test } from '@nestjs/testing';
import { HonorificAlreadyExistsError } from 'src/app/global/honorific/domain/errors/honorific-already-exists.error';
import { HonorificModule } from 'src/app/global/honorific/honorific.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateHonorific } from './create-honorific.service';
import { CreateHonorificInputDto } from './dtos/create-honorific.dto';

describe('CreateHonorific - Integration tests', () => {
  let sut: CreateHonorific;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [HonorificModule],
    }).compile();

    sut = module.get(CreateHonorific);
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

  it('should create honorific and return id', async() => {
    const input: CreateHonorificInputDto = { name: 'Sr.' };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.honorific.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe('Sr.');
  });

  it('should reject duplicate name (case-insensitive)', async() => {
    await prisma.honorific.create({ data: { name: 'Dr.' } });

    await expect(sut.execute({ name: 'dr.' })).rejects.toThrow(HonorificAlreadyExistsError);
  });
});
