import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NbsAlreadyExistsError } from '../../../domain/errors/nbs-already-exists.error';
import { NbsNotFoundError } from '../../../domain/errors/nbs-not-found.error';
import { EditNbsInputDto } from './dtos/edit-nbs.dto';
import { EditNbs } from './edit-nbs.service';
import { NbsModule } from '../../../nbs.module';

describe('EditNbs - Integration tests', () => {
  let sut: EditNbs;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NbsModule],
    }).compile();

    sut = module.get(EditNbs);
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
    const data: EditNbsInputDto = {
      code: '1012-1/01',
      description: 'Nova descrição',
    };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(NbsNotFoundError);
  });

  it('should update nbs code and description', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Desc original', active: true },
    });
    const data: EditNbsInputDto = {
      code: '1012-1/02',
      description: 'Desc atualizada',
    };

    // Act
    await sut.execute(nbs.id, data);

    // Assert
    const updated = await prisma.nbs.findUnique({ where: { id: nbs.id } });
    expect(updated?.code).toBe('1012-1/02');
    expect(updated?.description).toBe('Desc atualizada');
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });
    const data: EditNbsInputDto = {
      code: '1012-1/02',
      description: 'Nova descrição',
    };

    // Act
    const result = await sut.execute(nbs.id, data);

    // Assert
    expect(result).toEqual({ message: 'NBS atualizado com sucesso' });
  });

  it('should throw NbsAlreadyExistsError when editing to duplicate code', async() => {
    // Arrange
    await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Desc A', active: true },
    });
    const nbsB = await prisma.nbs.create({
      data: { code: '1012-1/02', description: 'Desc B', active: true },
    });
    const data: EditNbsInputDto = {
      code: '1012-1/01',
      description: 'Desc B',
    };

    // Act & Assert
    await expect(sut.execute(nbsB.id, data)).rejects.toThrow(NbsAlreadyExistsError);
  });

  it('should allow edit when code belongs to the same nbs being edited', async() => {
    // Arrange
    const nbs = await prisma.nbs.create({
      data: { code: '1012-1/01', description: 'Desc', active: true },
    });
    const data: EditNbsInputDto = {
      code: '1012-1/01',
      description: 'Desc atualizada',
    };

    // Act
    await sut.execute(nbs.id, data);

    // Assert
    const updated = await prisma.nbs.findUnique({ where: { id: nbs.id } });
    expect(updated?.code).toBe('1012-1/01');
    expect(updated?.description).toBe('Desc atualizada');
    expect(updated?.active).toBe(true);
  });
});
