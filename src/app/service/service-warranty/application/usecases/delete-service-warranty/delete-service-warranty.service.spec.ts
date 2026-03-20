import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import { ServiceWarrantyModule } from '../../../service-warranty.module';
import { DeleteServiceWarranty } from './delete-service-warranty.service';

describe('DeleteServiceWarranty - Integration tests', () => {
  let sut: DeleteServiceWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceWarrantyModule],
    }).compile();

    sut = module.get(DeleteServiceWarranty);
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
  });

  it('should delete service warranty from database', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    await sut.execute(serviceWarranty.id);

    const deleted = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceWarranty.id);

    expect(result).toEqual({ message: 'Garantia de serviço excluída com sucesso' });
  });
});
