import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NbsAlreadyExistsError } from '../../../domain/errors/nbs-already-exists.error';
import { CreateNbs } from './create-nbs.service';
import { CreateNbsInputDto } from './dtos/create-nbs.dto';
import { NbsModule } from '../../../nbs.module';

describe('CreateNbs - Integration tests', () => {
  let sut: CreateNbs;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NbsModule],
    }).compile();

    sut = module.get(CreateNbs);
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

  it('should throw NbsAlreadyExistsError when creating with duplicate code', async() => {
    // Arrange
    const input: CreateNbsInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(NbsAlreadyExistsError);
  });

  it('should create nbs and return id', async() => {
    // Arrange
    const input: CreateNbsInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.nbs.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.code).toBe(input.code);
    expect(saved?.description).toBe(input.description);
    expect(saved?.active).toBe(true);
  });

  it('should persist nbs in database', async() => {
    // Arrange
    const input: CreateNbsInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const nbs = await prisma.nbs.findUnique({ where: { id } });
    expect(nbs).toEqual(
      expect.objectContaining({
        id,
        code: input.code,
        description: input.description,
        active: true,
      }),
    );
    expect(nbs?.createdAt).toBeInstanceOf(Date);
    expect(nbs?.updatedAt).toBeInstanceOf(Date);
  });
});
