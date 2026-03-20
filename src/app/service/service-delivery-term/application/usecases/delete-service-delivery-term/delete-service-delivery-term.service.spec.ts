import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import { ServiceDeliveryTermModule } from '../../../service-delivery-term.module';
import { DeleteServiceDeliveryTerm } from './delete-service-delivery-term.service';

describe('DeleteServiceDeliveryTerm - Integration tests', () => {
  let sut: DeleteServiceDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceDeliveryTermModule],
    }).compile();

    sut = module.get(DeleteServiceDeliveryTerm);
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
  });

  it('should delete service delivery term from database', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    await sut.execute(serviceDeliveryTerm.id);

    const deleted = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceDeliveryTerm.id);

    expect(result).toEqual({ message: 'Prazo de entrega excluído com sucesso' });
  });
});
