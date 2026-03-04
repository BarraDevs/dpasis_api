import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeModule } from '../../../cnae.module';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import { UpdateCnaeStatus } from './update-cnae-status.service';

describe('UpdateCnaeStatus - Integration tests', () => {
  let sut: UpdateCnaeStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeModule],
    }).compile();

    sut = module.get(UpdateCnaeStatus);
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

  it('should invert active from true to false', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    await sut.execute(cnae.id);

    // Assert
    const updated = await prisma.cnae.findUnique({ where: { id: cnae.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act
    await sut.execute(cnae.id);

    // Assert
    const updated = await prisma.cnae.findUnique({ where: { id: cnae.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    const result = await sut.execute(cnae.id);

    // Assert
    expect(result).toEqual({ message: 'Status do CNAE atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Fabricação', active: true },
    });

    // Act
    await sut.execute(cnae.id);

    // Assert
    const updated = await prisma.cnae.findUnique({ where: { id: cnae.id } });
    expect(updated?.code).toBe('1012-1/01');
    expect(updated?.description).toBe('Fabricação');
    expect(updated?.active).toBe(false);
  });
});
