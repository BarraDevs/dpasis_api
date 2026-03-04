import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IndopAlreadyExistsError } from '../../../domain/errors/indop-already-exists.error';
import { CreateIndop } from './create-indop.service';
import { CreateIndopInputDto } from './dtos/create-indop.dto';
import { IndopModule } from '../../../indop.module';

describe('CreateIndop - Integration tests', () => {
  let sut: CreateIndop;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [IndopModule],
    }).compile();

    sut = module.get(CreateIndop);
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

  it('should throw IndopAlreadyExistsError when creating with duplicate code', async() => {
    // Arrange
    const input: CreateIndopInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(IndopAlreadyExistsError);
  });

  it('should create indop and return id', async() => {
    // Arrange
    const input: CreateIndopInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.indop.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.code).toBe(input.code);
    expect(saved?.description).toBe(input.description);
    expect(saved?.active).toBe(true);
  });

  it('should persist indop in database', async() => {
    // Arrange
    const input: CreateIndopInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const indop = await prisma.indop.findUnique({ where: { id } });
    expect(indop).toEqual(
      expect.objectContaining({
        id,
        code: input.code,
        description: input.description,
        active: true,
      }),
    );
    expect(indop?.createdAt).toBeInstanceOf(Date);
    expect(indop?.updatedAt).toBeInstanceOf(Date);
  });
});
