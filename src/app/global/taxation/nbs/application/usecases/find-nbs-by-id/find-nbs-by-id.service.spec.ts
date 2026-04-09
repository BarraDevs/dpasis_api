import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NbsNotFoundError } from '../../../domain/errors/nbs-not-found.error';
import { NbsDto } from '../../dtos/nbs.dto';
import { FindNbsById } from './find-nbs-by-id.service';
import { NbsModule } from '../../../nbs.module';

describe('FindNbsById - Integration tests', () => {
  let sut: FindNbsById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NbsModule],
    }).compile();

    sut = module.get(FindNbsById);
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
    await expect(sut.execute(id)).rejects.toThrow('NBS não encontrado na base de dados.');
  });

  it('should throw NbsNotFoundError when nbs is inactive and onlyActive is true', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act & Assert
    await expect(sut.execute(nbs.id, { onlyActive: true })).rejects.toThrow(NbsNotFoundError);
    await expect(sut.execute(nbs.id, { onlyActive: true })).rejects.toThrow('NBS não encontrado na base de dados.');
  });

  it('should return nbs by id', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Fabricação', active: true },
    });

    // Act
    const result = await sut.execute(nbs.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(nbs.id);
    expect(result.code).toBe(nbs.code);
    expect(result.description).toBe(nbs.description);
    expect(result.active).toBe(nbs.active);
  });

  it('should return all nbs fields correctly', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act
    const result = await sut.execute(nbs.id);

    // Assert
    expect(result).toEqual<NbsDto>({
      id: nbs.id,
      code: nbs.code,
      description: nbs.description,
      active: nbs.active,
      createdAt: nbs.createdAt,
      updatedAt: nbs.updatedAt,
    });
  });
});
