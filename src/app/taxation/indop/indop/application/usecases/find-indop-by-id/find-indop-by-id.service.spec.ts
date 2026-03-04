import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IndopNotFoundError } from '../../../domain/errors/indop-not-found.error';
import { IndopDto } from '../../dtos/indop.dto';
import { FindIndopById } from './find-indop-by-id.service';
import { IndopModule } from '../../../indop.module';

describe('FindIndopById - Integration tests', () => {
  let sut: FindIndopById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [IndopModule],
    }).compile();

    sut = module.get(FindIndopById);
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
    await expect(sut.execute(id)).rejects.toThrow('INDOP não encontrado na base de dados.');
  });

  it('should throw IndopNotFoundError when indop is inactive and onlyActive is true', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act & Assert
    await expect(sut.execute(indop.id, true)).rejects.toThrow(IndopNotFoundError);
    await expect(sut.execute(indop.id, true)).rejects.toThrow('INDOP não encontrado na base de dados.');
  });

  it('should return indop by id', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Fabricação', active: true },
    });

    // Act
    const result = await sut.execute(indop.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(indop.id);
    expect(result.code).toBe(indop.code);
    expect(result.description).toBe(indop.description);
    expect(result.active).toBe(indop.active);
  });

  it('should return all indop fields correctly', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act
    const result = await sut.execute(indop.id);

    // Assert
    expect(result).toEqual<IndopDto>({
      id: indop.id,
      code: indop.code,
      description: indop.description,
      active: indop.active,
      createdAt: indop.createdAt,
      updatedAt: indop.updatedAt,
    });
  });
});
