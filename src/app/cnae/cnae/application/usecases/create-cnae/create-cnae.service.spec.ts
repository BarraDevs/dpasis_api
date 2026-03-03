import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeAlreadyExistsError } from '../../../domain/errors/cnae-already-exists.error';
import { CreateCnae } from './create-cnae.service';
import { CreateCnaeInputDto } from './dtos/create-cnae.dto';
import { CnaeModule } from '../../../cnae.module';

describe('CreateCnae - Integration tests', () => {
  let sut: CreateCnae;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeModule],
    }).compile();

    sut = module.get(CreateCnae);
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

  it('should throw CnaeAlreadyExistsError when creating with duplicate code', async() => {
    // Arrange
    const input: CreateCnaeInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(CnaeAlreadyExistsError);
  });

  it('should create cnae and return id', async() => {
    // Arrange
    const input: CreateCnaeInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.cnae.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.code).toBe(input.code);
    expect(saved?.description).toBe(input.description);
    expect(saved?.active).toBe(true);
  });

  it('should persist cnae in database', async() => {
    // Arrange
    const input: CreateCnaeInputDto = {
      code: '1012-1/01',
      description: 'Fabricação de produtos alimentícios',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const cnae = await prisma.cnae.findUnique({ where: { id } });
    expect(cnae).toEqual(
      expect.objectContaining({
        id,
        code: input.code,
        description: input.description,
        active: true,
      }),
    );
    expect(cnae?.createdAt).toBeInstanceOf(Date);
    expect(cnae?.updatedAt).toBeInstanceOf(Date);
  });
});
