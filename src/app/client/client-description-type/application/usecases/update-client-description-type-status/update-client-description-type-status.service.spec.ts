import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeModule } from '../../../client-description-type.module';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import { UpdateClientDescriptionTypeStatus } from './update-client-description-type-status.service';

describe('UpdateClientDescriptionTypeStatus - Integration tests', () => {
  let sut: UpdateClientDescriptionTypeStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDescriptionTypeModule],
    }).compile();

    sut = module.get(UpdateClientDescriptionTypeStatus);
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
  });

  it('should invert active from true to false', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    await sut.execute(clientDescriptionType.id);

    const updated = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: false },
    });

    await sut.execute(clientDescriptionType.id);

    const updated = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDescriptionType.id);

    expect(result).toEqual({ message: 'Status do tipo de descrição de cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Descrição Premium ${Date.now()}`, active: true },
    });

    await sut.execute(clientDescriptionType.id);

    const updated = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
    expect(updated?.name).toBe(clientDescriptionType.name);
    expect(updated?.active).toBe(false);
  });
});
