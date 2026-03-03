import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeAlreadyExistsError } from '../../../domain/errors/cnae-already-exists.error';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import { EditCnaeInputDto } from './dtos/edit-cnae.dto';
import { EditCnae } from './edit-cnae.service';
import { CnaeModule } from '../../../cnae.module';

describe('EditCnae - Integration tests', () => {
  let sut: EditCnae;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeModule],
    }).compile();

    sut = module.get(EditCnae);
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
    const data: EditCnaeInputDto = {
      code: '1012-1/01',
      description: 'Nova descrição',
    };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(CnaeNotFoundError);
  });

  it('should update cnae code and description', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Desc original', active: true },
    });
    const data: EditCnaeInputDto = {
      code: '1012-1/02',
      description: 'Desc atualizada',
    };

    // Act
    await sut.execute(cnae.id, data);

    // Assert
    const updated = await prisma.cnae.findUnique({ where: { id: cnae.id } });
    expect(updated?.code).toBe('1012-1/02');
    expect(updated?.description).toBe('Desc atualizada');
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });
    const data: EditCnaeInputDto = {
      code: '1012-1/02',
      description: 'Nova descrição',
    };

    // Act
    const result = await sut.execute(cnae.id, data);

    // Assert
    expect(result).toEqual({ message: 'CNAE atualizado com sucesso' });
  });

  it('should throw CnaeAlreadyExistsError when editing to duplicate code', async() => {
    // Arrange
    await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Desc A', active: true },
    });
    const cnaeB = await prisma.cnae.create({
      data: { code: '1012-1/02', description: 'Desc B', active: true },
    });
    const data: EditCnaeInputDto = {
      code: '1012-1/01',
      description: 'Desc B',
    };

    // Act & Assert
    await expect(sut.execute(cnaeB.id, data)).rejects.toThrow(CnaeAlreadyExistsError);
  });

  it('should allow edit when code belongs to the same cnae being edited', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Desc', active: true },
    });
    const data: EditCnaeInputDto = {
      code: '1012-1/01',
      description: 'Desc atualizada',
    };

    // Act
    await sut.execute(cnae.id, data);

    // Assert
    const updated = await prisma.cnae.findUnique({ where: { id: cnae.id } });
    expect(updated?.code).toBe('1012-1/01');
    expect(updated?.description).toBe('Desc atualizada');
    expect(updated?.active).toBe(true);
  });
});
