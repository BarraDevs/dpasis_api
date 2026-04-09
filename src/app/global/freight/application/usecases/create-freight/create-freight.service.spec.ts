import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FreightAlreadyExistsError } from '../../../domain/errors/freight-already-exists.error';
import { FreightModule } from '../../../freight.module';
import { CreateFreight } from './create-freight.service';
import { CreateFreightInputDto } from './dtos/create-freight.dto';

describe('CreateFreight - Integration tests', () => {
  let sut: CreateFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FreightModule],
    }).compile();

    sut = module.get(CreateFreight);
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

  it('should throw FreightAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Freight ${Date.now()}-${Math.random()}`;

    const input: CreateFreightInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(FreightAlreadyExistsError);
  });

  it('should create freight and return id', async() => {
    const input: CreateFreightInputDto = {
      name: `CIF ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.freight.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist freight in database', async() => {
    const input: CreateFreightInputDto = {
      name: `FOB ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const freightRow = await prisma.freight.findUnique({ where: { id } });
    expect(freightRow).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(freightRow?.createdAt).toBeInstanceOf(Date);
    expect(freightRow?.updatedAt).toBeInstanceOf(Date);
  });
});
