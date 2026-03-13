import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeModule } from '../../../client-description-type.module';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import { DeleteClientDescriptionType } from './delete-client-description-type.service';

describe('DeleteClientDescriptionType - Integration tests', () => {
  let sut: DeleteClientDescriptionType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDescriptionTypeModule],
    }).compile();

    sut = module.get(DeleteClientDescriptionType);
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

  it('should delete client description type from database', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    await sut.execute(clientDescriptionType.id);

    const deleted = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDescriptionType.id);

    expect(result).toEqual({ message: 'Tipo de descrição de cliente excluído com sucesso' });
  });
});
