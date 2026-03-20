import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import { ServiceFreightModule } from '../../../service-freight.module';
import { DeleteServiceFreight } from './delete-service-freight.service';

describe('DeleteServiceFreight - Integration tests', () => {
  let sut: DeleteServiceFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceFreightModule],
    }).compile();

    sut = module.get(DeleteServiceFreight);
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
  });

  it('should delete service freight from database', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    await sut.execute(serviceFreight.id);

    const deleted = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceFreight.id);

    expect(result).toEqual({ message: 'Frete de serviço excluído com sucesso' });
  });
});
