import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledModule } from '../../../billed.module';
import { CreateBilled } from './create-billed.service';
import { CreateBilledInputDto } from './dtos/create-billed.dto';

describe('CreateBilled - Integration tests', () => {
  let sut: CreateBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BilledModule],
    }).compile();

    sut = module.get(CreateBilled);
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

  it('should create billed and return id', async() => {
    const input: CreateBilledInputDto = {
      description: `Descrição ${Date.now()}-${Math.random()}`,
      isJunction: false,
      installmentDays: [5, 15, 25],
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.billed.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.description).toBe(input.description);
    expect(saved?.isJunction).toBe(input.isJunction);
    expect(saved?.installmentDays).toEqual(input.installmentDays);
    expect(saved?.active).toBe(true);
  });

  it('should persist billed with isJunction true and empty installmentDays', async() => {
    const input: CreateBilledInputDto = {
      description: `Junção ${Date.now()}`,
      isJunction: true,
      installmentDays: [],
    };

    const { id } = await sut.execute(input);

    const persisted = await prisma.billed.findUnique({ where: { id } });
    expect(persisted).toEqual(
      expect.objectContaining({
        id,
        description: input.description,
        isJunction: true,
        installmentDays: [],
        active: true,
      }),
    );
    expect(persisted?.createdAt).toBeInstanceOf(Date);
    expect(persisted?.updatedAt).toBeInstanceOf(Date);
  });
});
