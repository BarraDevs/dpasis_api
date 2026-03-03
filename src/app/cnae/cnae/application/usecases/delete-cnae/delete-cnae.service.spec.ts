import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import { DeleteCnae } from './delete-cnae.service';
import { CnaeModule } from '../../../cnae.module';

describe('DeleteCnae - Integration tests', () => {
  let sut: DeleteCnae;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeModule],
    }).compile();

    sut = module.get(DeleteCnae);
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

  it('should throw CnaeNotFoundError when cnae does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(CnaeNotFoundError);
  });

  it('should delete cnae from database', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    await sut.execute(cnae.id);

    // Assert
    const deleted = await prisma.cnae.findUnique({ where: { id: cnae.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    const result = await sut.execute(cnae.id);

    // Assert
    expect(result).toEqual({ message: 'CNAE excluído com sucesso' });
  });
});
