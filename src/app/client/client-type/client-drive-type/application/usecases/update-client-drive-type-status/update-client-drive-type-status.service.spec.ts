import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeModule } from '../../../client-drive-type.module';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import { UpdateClientDriveTypeStatus } from './update-client-drive-type-status.service';

describe('UpdateClientDriveTypeStatus - Integration tests', () => {
  let sut: UpdateClientDriveTypeStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDriveTypeModule],
    }).compile();

    sut = module.get(UpdateClientDriveTypeStatus);
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

  it('should invert active from true to false', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: true },
    });

    await sut.execute(clientDriveType.id);

    const updated = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: false },
    });

    await sut.execute(clientDriveType.id);

    const updated = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDriveType.id);

    expect(result).toEqual({ message: 'Status do tipo de drive de cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Google Drive ${Date.now()}`, active: true },
    });

    await sut.execute(clientDriveType.id);

    const updated = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
    expect(updated?.name).toBe(clientDriveType.name);
    expect(updated?.active).toBe(false);
  });
});
