import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import { ServiceFreightModule } from '../../../service-freight.module';
import { ServiceFreightDto } from '../../dtos/service-freight.dto';
import { FindServiceFreightById } from './find-service-freight-by-id.service';

describe('FindServiceFreightById - Integration tests', () => {
  let sut: FindServiceFreightById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceFreightModule],
    }).compile();

    sut = module.get(FindServiceFreightById);
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

  it('should throw ServiceFreightNotFoundError when service freight does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceFreightNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Frete de serviço não encontrado na base de dados.');
  });

  it('should throw ServiceFreightNotFoundError when service freight is inactive and onlyActive is true', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(serviceFreight.id, { onlyActive: true })).rejects.toThrow(ServiceFreightNotFoundError);
    await expect(sut.execute(serviceFreight.id, { onlyActive: true })).rejects.toThrow('Frete de serviço não encontrado na base de dados.');
  });

  it('should return service freight by id', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceFreight.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(serviceFreight.id);
    expect(result.name).toBe(serviceFreight.name);
    expect(result.active).toBe(serviceFreight.active);
  });

  it('should return all service freight fields correctly', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(serviceFreight.id);

    expect(result).toEqual<ServiceFreightDto>({
      id: serviceFreight.id,
      name: serviceFreight.name,
      active: serviceFreight.active,
      createdAt: serviceFreight.createdAt,
      updatedAt: serviceFreight.updatedAt,
    });
  });
});
