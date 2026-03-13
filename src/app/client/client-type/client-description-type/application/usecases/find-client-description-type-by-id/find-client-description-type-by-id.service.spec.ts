import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeModule } from '../../../client-description-type.module';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import { ClientDescriptionTypeDto } from '../../dtos/client-description-type.dto';
import { FindClientDescriptionTypeById } from './find-client-description-type-by-id.service';

describe('FindClientDescriptionTypeById - Integration tests', () => {
  let sut: FindClientDescriptionTypeById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDescriptionTypeModule],
    }).compile();

    sut = module.get(FindClientDescriptionTypeById);
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

  it('should throw ClientDescriptionTypeNotFoundError when client description type does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ClientDescriptionTypeNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Tipo de descrição de cliente não encontrado na base de dados.');
  });

  it('should throw ClientDescriptionTypeNotFoundError when client description type is inactive and onlyActive is true', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(clientDescriptionType.id, { onlyActive: true })).rejects.toThrow(ClientDescriptionTypeNotFoundError);
    await expect(sut.execute(clientDescriptionType.id, { onlyActive: true })).rejects.toThrow('Tipo de descrição de cliente não encontrado na base de dados.');
  });

  it('should return client description type by id', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDescriptionType.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(clientDescriptionType.id);
    expect(result.name).toBe(clientDescriptionType.name);
    expect(result.active).toBe(clientDescriptionType.active);
  });

  it('should return all client description type fields correctly', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(clientDescriptionType.id);

    expect(result).toEqual<ClientDescriptionTypeDto>({
      id: clientDescriptionType.id,
      name: clientDescriptionType.name,
      active: clientDescriptionType.active,
      createdAt: clientDescriptionType.createdAt,
      updatedAt: clientDescriptionType.updatedAt,
    });
  });
});
