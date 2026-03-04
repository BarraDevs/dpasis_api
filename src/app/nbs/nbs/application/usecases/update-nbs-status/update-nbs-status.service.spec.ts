import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NbsNotFoundError } from '../../../domain/errors/nbs-not-found.error';
import { UpdateNbsStatus } from './update-nbs-status.service';
import { NbsModule } from '../../../nbs.module';

describe('UpdateNbsStatus - Integration tests', () => {
  let sut: UpdateNbsStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NbsModule],
    }).compile();

    sut = module.get(UpdateNbsStatus);
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

  it('should throw NbsNotFoundError when nbs does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(NbsNotFoundError);
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    await sut.execute(nbs.id);

    // Assert
    const updated = await prisma.nbs.findUnique({ where: { id: nbs.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act
    await sut.execute(nbs.id);

    // Assert
    const updated = await prisma.nbs.findUnique({ where: { id: nbs.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    const result = await sut.execute(nbs.id);

    // Assert
    expect(result).toEqual({ message: 'Status do NBS atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Fabricação', active: true },
    });

    // Act
    await sut.execute(nbs.id);

    // Assert
    const updated = await prisma.nbs.findUnique({ where: { id: nbs.id } });
    expect(updated?.code).toBe('1012-1/01');
    expect(updated?.description).toBe('Fabricação');
    expect(updated?.active).toBe(false);
  });
});
