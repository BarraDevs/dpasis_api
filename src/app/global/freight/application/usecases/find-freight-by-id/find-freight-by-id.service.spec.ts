import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import { FreightModule } from '../../../freight.module';
import { FreightDto } from '../../dtos/freight.dto';
import { FindFreightById } from './find-freight-by-id.service';

describe('FindFreightById - Integration tests', () => {
  let sut: FindFreightById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FreightModule],
    }).compile();

    sut = module.get(FindFreightById);
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

  it('should throw FreightNotFoundError when freight does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(FreightNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Frete não encontrado na base de dados.');
  });

  it('should throw FreightNotFoundError when freight is inactive and onlyActive is true', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(freightRow.id, { onlyActive: true })).rejects.toThrow(FreightNotFoundError);
    await expect(sut.execute(freightRow.id, { onlyActive: true })).rejects.toThrow('Frete não encontrado na base de dados.');
  });

  it('should return freight by id', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(freightRow.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(freightRow.id);
    expect(result.name).toBe(freightRow.name);
    expect(result.active).toBe(freightRow.active);
  });

  it('should return all freight fields correctly', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(freightRow.id);

    expect(result).toEqual<FreightDto>({
      id: freightRow.id,
      name: freightRow.name,
      active: freightRow.active,
      createdAt: freightRow.createdAt,
      updatedAt: freightRow.updatedAt,
    });
  });
});
