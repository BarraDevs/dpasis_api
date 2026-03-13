import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import { UpdateClientSystemTypeStatus } from './update-client-system-type-status.service';

describe('UpdateClientSystemTypeStatus - Integration tests', () => {
  let sut: UpdateClientSystemTypeStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(UpdateClientSystemTypeStatus);
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
  });

  it('should invert active from true to false', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });
    await sut.execute(clientSystemType.id);
    const updated = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: false },
    });
    await sut.execute(clientSystemType.id);
    const updated = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });
    const result = await sut.execute(clientSystemType.id);
    expect(result).toEqual({ message: 'Status do tipo de sistema de cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Sistema Premium ${Date.now()}`, active: true },
    });
    await sut.execute(clientSystemType.id);
    const updated = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
    expect(updated?.name).toBe(clientSystemType.name);
    expect(updated?.active).toBe(false);
  });
});
