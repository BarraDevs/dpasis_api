import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeAlreadyExistsError } from '../../../domain/errors/client-system-type-already-exists.error';
import { CreateClientSystemType } from './create-client-system-type.service';
import { CreateClientSystemTypeInputDto } from './dtos/create-client-system-type.dto';

describe('CreateClientSystemType - Integration tests', () => {
  let sut: CreateClientSystemType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(CreateClientSystemType);
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

  it('should throw ClientSystemTypeAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Sistema ${Date.now()}-${Math.random()}`;
    const input: CreateClientSystemTypeInputDto = { name };

    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ClientSystemTypeAlreadyExistsError);
  });

  it('should create client system type and return id', async() => {
    const input: CreateClientSystemTypeInputDto = {
      name: `Sistema ERP ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientSystemType.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client system type in database', async() => {
    const input: CreateClientSystemTypeInputDto = {
      name: `Sistema CRM ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const clientSystemType = await prisma.clientSystemType.findUnique({ where: { id } });
    expect(clientSystemType).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientSystemType?.createdAt).toBeInstanceOf(Date);
    expect(clientSystemType?.updatedAt).toBeInstanceOf(Date);
  });
});
