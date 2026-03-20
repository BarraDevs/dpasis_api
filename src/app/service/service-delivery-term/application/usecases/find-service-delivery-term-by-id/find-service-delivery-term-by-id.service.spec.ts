import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import { ServiceDeliveryTermModule } from '../../../service-delivery-term.module';
import { ServiceDeliveryTermDto } from '../../dtos/service-delivery-term.dto';
import { FindServiceDeliveryTermById } from './find-service-delivery-term-by-id.service';

describe('FindServiceDeliveryTermById - Integration tests', () => {
  let sut: FindServiceDeliveryTermById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceDeliveryTermModule],
    }).compile();

    sut = module.get(FindServiceDeliveryTermById);
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

  it('should throw ServiceDeliveryTermNotFoundError when service delivery term does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceDeliveryTermNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Prazo de entrega não encontrado na base de dados.');
  });

  it('should throw ServiceDeliveryTermNotFoundError when service delivery term is inactive and onlyActive is true', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(serviceDeliveryTerm.id, { onlyActive: true })).rejects.toThrow(ServiceDeliveryTermNotFoundError);
    await expect(sut.execute(serviceDeliveryTerm.id, { onlyActive: true })).rejects.toThrow('Prazo de entrega não encontrado na base de dados.');
  });

  it('should return service delivery term by id', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceDeliveryTerm.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(serviceDeliveryTerm.id);
    expect(result.name).toBe(serviceDeliveryTerm.name);
    expect(result.active).toBe(serviceDeliveryTerm.active);
  });

  it('should return all service delivery term fields correctly', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(serviceDeliveryTerm.id);

    expect(result).toEqual<ServiceDeliveryTermDto>({
      id: serviceDeliveryTerm.id,
      name: serviceDeliveryTerm.name,
      active: serviceDeliveryTerm.active,
      createdAt: serviceDeliveryTerm.createdAt,
      updatedAt: serviceDeliveryTerm.updatedAt,
    });
  });
});
