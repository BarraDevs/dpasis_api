import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IndopNotFoundError } from '../../../domain/errors/indop-not-found.error';
import { UpdateIndopStatus } from './update-indop-status.service';
import { IndopModule } from '../../../indop.module';

describe('UpdateIndopStatus - Integration tests', () => {
  let sut: UpdateIndopStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [IndopModule],
    }).compile();

    sut = module.get(UpdateIndopStatus);
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

  it('should throw IndopNotFoundError when indop does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(IndopNotFoundError);
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    await sut.execute(indop.id);

    // Assert
    const updated = await prisma.indop.findUnique({ where: { id: indop.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act
    await sut.execute(indop.id);

    // Assert
    const updated = await prisma.indop.findUnique({ where: { id: indop.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    const result = await sut.execute(indop.id);

    // Assert
    expect(result).toEqual({ message: 'Status do INDOP atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Fabricação', active: true },
    });

    // Act
    await sut.execute(indop.id);

    // Assert
    const updated = await prisma.indop.findUnique({ where: { id: indop.id } });
    expect(updated?.code).toBe('1012-1/01');
    expect(updated?.description).toBe('Fabricação');
    expect(updated?.active).toBe(false);
  });
});
