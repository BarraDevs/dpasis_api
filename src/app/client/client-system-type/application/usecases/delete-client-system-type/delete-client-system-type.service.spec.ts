import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import { DeleteClientSystemType } from './delete-client-system-type.service';

describe('DeleteClientSystemType - Integration tests', () => {
  let sut: DeleteClientSystemType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(DeleteClientSystemType);
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

  it('should delete client system type from database', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    await sut.execute(clientSystemType.id);

    const deleted = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientSystemType.id);

    expect(result).toEqual({ message: 'Tipo de sistema de cliente excluído com sucesso' });
  });
});
