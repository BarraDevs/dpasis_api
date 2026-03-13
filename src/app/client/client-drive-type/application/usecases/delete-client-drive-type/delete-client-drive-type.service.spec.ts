import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeModule } from '../../../client-drive-type.module';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import { DeleteClientDriveType } from './delete-client-drive-type.service';

describe('DeleteClientDriveType - Integration tests', () => {
  let sut: DeleteClientDriveType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDriveTypeModule],
    }).compile();

    sut = module.get(DeleteClientDriveType);
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
  });

  it('should delete client drive type from database', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: true },
    });

    await sut.execute(clientDriveType.id);

    const deleted = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDriveType.id);

    expect(result).toEqual({ message: 'Tipo de drive de cliente excluído com sucesso' });
  });
});
