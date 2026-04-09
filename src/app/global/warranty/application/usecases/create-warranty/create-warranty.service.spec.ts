import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { WarrantyAlreadyExistsError } from '../../../domain/errors/warranty-already-exists.error';
import { WarrantyModule } from '../../../warranty.module';
import { CreateWarranty } from './create-warranty.service';
import { CreateWarrantyInputDto } from './dtos/create-warranty.dto';

describe('CreateWarranty - Integration tests', () => {
  let sut: CreateWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [WarrantyModule],
    }).compile();

    sut = module.get(CreateWarranty);
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

  it('should throw WarrantyAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Warranty ${Date.now()}-${Math.random()}`;

    const input: CreateWarrantyInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(WarrantyAlreadyExistsError);
  });

  it('should create warranty and return id', async() => {
    const input: CreateWarrantyInputDto = {
      name: `90 dias ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.warranty.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist warranty in database', async() => {
    const input: CreateWarrantyInputDto = {
      name: `1 ano ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const warranty = await prisma.warranty.findUnique({ where: { id } });
    expect(warranty).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(warranty?.createdAt).toBeInstanceOf(Date);
    expect(warranty?.updatedAt).toBeInstanceOf(Date);
  });
});
