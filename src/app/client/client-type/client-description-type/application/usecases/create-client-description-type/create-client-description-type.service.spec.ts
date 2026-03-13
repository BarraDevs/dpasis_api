import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeModule } from '../../../client-description-type.module';
import { ClientDescriptionTypeAlreadyExistsError } from '../../../domain/errors/client-description-type-already-exists.error';
import { CreateClientDescriptionType } from './create-client-description-type.service';
import { CreateClientDescriptionTypeInputDto } from './dtos/create-client-description-type.dto';

describe('CreateClientDescriptionType - Integration tests', () => {
  let sut: CreateClientDescriptionType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDescriptionTypeModule],
    }).compile();

    sut = module.get(CreateClientDescriptionType);
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

  it('should throw ClientDescriptionTypeAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Descrição ${Date.now()}-${Math.random()}`;
    const input: CreateClientDescriptionTypeInputDto = { name };

    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ClientDescriptionTypeAlreadyExistsError);
  });

  it('should create client description type and return id', async() => {
    const input: CreateClientDescriptionTypeInputDto = {
      name: `Descrição ERP ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientDescriptionType.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client description type in database', async() => {
    const input: CreateClientDescriptionTypeInputDto = {
      name: `Descrição CRM ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const clientDescriptionType = await prisma.clientDescriptionType.findUnique({ where: { id } });
    expect(clientDescriptionType).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientDescriptionType?.createdAt).toBeInstanceOf(Date);
    expect(clientDescriptionType?.updatedAt).toBeInstanceOf(Date);
  });
});
