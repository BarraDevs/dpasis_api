import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceWarrantyAlreadyExistsError } from '../../../domain/errors/service-warranty-already-exists.error';
import { ServiceWarrantyModule } from '../../../service-warranty.module';
import { CreateServiceWarranty } from './create-service-warranty.service';
import { CreateServiceWarrantyInputDto } from './dtos/create-service-warranty.dto';

describe('CreateServiceWarranty - Integration tests', () => {
  let sut: CreateServiceWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceWarrantyModule],
    }).compile();

    sut = module.get(CreateServiceWarranty);
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

  it('should throw ServiceWarrantyAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Warranty ${Date.now()}-${Math.random()}`;

    const input: CreateServiceWarrantyInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ServiceWarrantyAlreadyExistsError);
  });

  it('should create service warranty and return id', async() => {
    const input: CreateServiceWarrantyInputDto = {
      name: `90 dias ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.serviceWarranty.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist service warranty in database', async() => {
    const input: CreateServiceWarrantyInputDto = {
      name: `1 ano ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const serviceWarranty = await prisma.serviceWarranty.findUnique({ where: { id } });
    expect(serviceWarranty).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(serviceWarranty?.createdAt).toBeInstanceOf(Date);
    expect(serviceWarranty?.updatedAt).toBeInstanceOf(Date);
  });
});
