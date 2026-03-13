import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeModule } from '../../../client-drive-type.module';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import { ClientDriveTypeDto } from '../../dtos/client-drive-type.dto';
import { FindClientDriveTypeById } from './find-client-drive-type-by-id.service';

describe('FindClientDriveTypeById - Integration tests', () => {
  let sut: FindClientDriveTypeById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDriveTypeModule],
    }).compile();

    sut = module.get(FindClientDriveTypeById);
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

  it('should throw ClientDriveTypeNotFoundError when client drive type does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ClientDriveTypeNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Tipo de drive de cliente não encontrado na base de dados.');
  });

  it('should throw ClientDriveTypeNotFoundError when client drive type is inactive and onlyActive is true', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(clientDriveType.id, { onlyActive: true })).rejects.toThrow(ClientDriveTypeNotFoundError);
    await expect(sut.execute(clientDriveType.id, { onlyActive: true })).rejects.toThrow('Tipo de drive de cliente não encontrado na base de dados.');
  });

  it('should return client drive type by id', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDriveType.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(clientDriveType.id);
    expect(result.name).toBe(clientDriveType.name);
    expect(result.active).toBe(clientDriveType.active);
  });

  it('should return all client drive type fields correctly', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(clientDriveType.id);

    expect(result).toEqual<ClientDriveTypeDto>({
      id: clientDriveType.id,
      name: clientDriveType.name,
      active: clientDriveType.active,
      createdAt: clientDriveType.createdAt,
      updatedAt: clientDriveType.updatedAt,
    });
  });
});
