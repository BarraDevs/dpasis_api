import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceFreightAlreadyExistsError } from '../../../domain/errors/service-freight-already-exists.error';
import { ServiceFreightModule } from '../../../service-freight.module';
import { CreateServiceFreight } from './create-service-freight.service';
import { CreateServiceFreightInputDto } from './dtos/create-service-freight.dto';

describe('CreateServiceFreight - Integration tests', () => {
  let sut: CreateServiceFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceFreightModule],
    }).compile();

    sut = module.get(CreateServiceFreight);
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

  it('should throw ServiceFreightAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Freight ${Date.now()}-${Math.random()}`;

    const input: CreateServiceFreightInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ServiceFreightAlreadyExistsError);
  });

  it('should create service freight and return id', async() => {
    const input: CreateServiceFreightInputDto = {
      name: `CIF ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.serviceFreight.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist service freight in database', async() => {
    const input: CreateServiceFreightInputDto = {
      name: `FOB ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const serviceFreight = await prisma.serviceFreight.findUnique({ where: { id } });
    expect(serviceFreight).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(serviceFreight?.createdAt).toBeInstanceOf(Date);
    expect(serviceFreight?.updatedAt).toBeInstanceOf(Date);
  });
});
