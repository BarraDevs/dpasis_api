import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import { ClientSystemTypeDto } from '../../dtos/client-system-type.dto';
import { FindClientSystemTypeById } from './find-client-system-type-by-id.service';

describe('FindClientSystemTypeById - Integration tests', () => {
  let sut: FindClientSystemTypeById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(FindClientSystemTypeById);
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

  it('should throw ClientSystemTypeNotFoundError when client system type does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ClientSystemTypeNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Tipo de sistema de cliente não encontrado na base de dados.');
  });

  it('should throw ClientSystemTypeNotFoundError when client system type is inactive and onlyActive is true', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: false },
    });
    await expect(sut.execute(clientSystemType.id, { onlyActive: true })).rejects.toThrow(ClientSystemTypeNotFoundError);
    await expect(sut.execute(clientSystemType.id, { onlyActive: true })).rejects.toThrow('Tipo de sistema de cliente não encontrado na base de dados.');
  });

  it('should return client system type by id', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: true },
    });
    const result = await sut.execute(clientSystemType.id);
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientSystemType.id);
    expect(result.name).toBe(clientSystemType.name);
    expect(result.active).toBe(clientSystemType.active);
  });

  it('should return all client system type fields correctly', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo VIP ${Date.now()}`, active: false },
    });
    const result = await sut.execute(clientSystemType.id);
    expect(result).toEqual<ClientSystemTypeDto>({
      id: clientSystemType.id,
      name: clientSystemType.name,
      imageUrl: clientSystemType.imageUrl,
      active: clientSystemType.active,
      createdAt: clientSystemType.createdAt,
      updatedAt: clientSystemType.updatedAt,
    });
  });
});
