import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IndopAlreadyExistsError } from '../../../domain/errors/indop-already-exists.error';
import { IndopNotFoundError } from '../../../domain/errors/indop-not-found.error';
import { EditIndopInputDto } from './dtos/edit-indop.dto';
import { EditIndop } from './edit-indop.service';
import { IndopModule } from '../../../indop.module';

describe('EditIndop - Integration tests', () => {
  let sut: EditIndop;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [IndopModule],
    }).compile();

    sut = module.get(EditIndop);
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
    const data: EditIndopInputDto = {
      code: '1012-1/01',
      description: 'Nova descrição',
    };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(IndopNotFoundError);
  });

  it('should update indop code and description', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Desc original', active: true },
    });
    const data: EditIndopInputDto = {
      code: '1012-1/02',
      description: 'Desc atualizada',
    };

    // Act
    await sut.execute(indop.id, data);

    // Assert
    const updated = await prisma.indop.findUnique({ where: { id: indop.id } });
    expect(updated?.code).toBe('1012-1/02');
    expect(updated?.description).toBe('Desc atualizada');
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });
    const data: EditIndopInputDto = {
      code: '1012-1/02',
      description: 'Nova descrição',
    };

    // Act
    const result = await sut.execute(indop.id, data);

    // Assert
    expect(result).toEqual({ message: 'INDOP atualizado com sucesso' });
  });

  it('should throw IndopAlreadyExistsError when editing to duplicate code', async() => {
    // Arrange
    await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Desc A', active: true },
    });
    const indopB = await prisma.indop.create({
      data: { code: '1012-1/02', description: 'Desc B', active: true },
    });
    const data: EditIndopInputDto = {
      code: '1012-1/01',
      description: 'Desc B',
    };

    // Act & Assert
    await expect(sut.execute(indopB.id, data)).rejects.toThrow(IndopAlreadyExistsError);
  });

  it('should allow edit when code belongs to the same indop being edited', async() => {
    // Arrange
    const indop = await prisma.indop.create({
      data: { code: '1012-1/01', description: 'Desc', active: true },
    });
    const data: EditIndopInputDto = {
      code: '1012-1/01',
      description: 'Desc atualizada',
    };

    // Act
    await sut.execute(indop.id, data);

    // Assert
    const updated = await prisma.indop.findUnique({ where: { id: indop.id } });
    expect(updated?.code).toBe('1012-1/01');
    expect(updated?.description).toBe('Desc atualizada');
    expect(updated?.active).toBe(true);
  });
});
