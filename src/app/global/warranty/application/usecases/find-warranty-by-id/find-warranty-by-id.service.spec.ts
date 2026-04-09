import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import { WarrantyModule } from '../../../warranty.module';
import { WarrantyDto } from '../../dtos/warranty.dto';
import { FindWarrantyById } from './find-warranty-by-id.service';

describe('FindWarrantyById - Integration tests', () => {
  let sut: FindWarrantyById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [WarrantyModule],
    }).compile();

    sut = module.get(FindWarrantyById);
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

  it('should throw WarrantyNotFoundError when warranty does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(WarrantyNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Garantia não encontrada na base de dados.');
  });

  it('should throw WarrantyNotFoundError when warranty is inactive and onlyActive is true', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(warranty.id, { onlyActive: true })).rejects.toThrow(WarrantyNotFoundError);
    await expect(sut.execute(warranty.id, { onlyActive: true })).rejects.toThrow('Garantia não encontrada na base de dados.');
  });

  it('should return warranty by id', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(warranty.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(warranty.id);
    expect(result.name).toBe(warranty.name);
    expect(result.active).toBe(warranty.active);
  });

  it('should return all warranty fields correctly', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(warranty.id);

    expect(result).toEqual<WarrantyDto>({
      id: warranty.id,
      name: warranty.name,
      active: warranty.active,
      createdAt: warranty.createdAt,
      updatedAt: warranty.updatedAt,
    });
  });
});
