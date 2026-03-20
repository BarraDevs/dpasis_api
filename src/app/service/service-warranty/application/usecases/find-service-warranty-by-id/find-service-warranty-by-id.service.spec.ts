import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import { ServiceWarrantyModule } from '../../../service-warranty.module';
import { ServiceWarrantyDto } from '../../dtos/service-warranty.dto';
import { FindServiceWarrantyById } from './find-service-warranty-by-id.service';

describe('FindServiceWarrantyById - Integration tests', () => {
  let sut: FindServiceWarrantyById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceWarrantyModule],
    }).compile();

    sut = module.get(FindServiceWarrantyById);
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

  it('should throw ServiceWarrantyNotFoundError when service warranty does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceWarrantyNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Garantia de serviço não encontrada na base de dados.');
  });

  it('should throw ServiceWarrantyNotFoundError when service warranty is inactive and onlyActive is true', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(serviceWarranty.id, { onlyActive: true })).rejects.toThrow(ServiceWarrantyNotFoundError);
    await expect(sut.execute(serviceWarranty.id, { onlyActive: true })).rejects.toThrow('Garantia de serviço não encontrada na base de dados.');
  });

  it('should return service warranty by id', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceWarranty.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(serviceWarranty.id);
    expect(result.name).toBe(serviceWarranty.name);
    expect(result.active).toBe(serviceWarranty.active);
  });

  it('should return all service warranty fields correctly', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(serviceWarranty.id);

    expect(result).toEqual<ServiceWarrantyDto>({
      id: serviceWarranty.id,
      name: serviceWarranty.name,
      active: serviceWarranty.active,
      createdAt: serviceWarranty.createdAt,
      updatedAt: serviceWarranty.updatedAt,
    });
  });
});
