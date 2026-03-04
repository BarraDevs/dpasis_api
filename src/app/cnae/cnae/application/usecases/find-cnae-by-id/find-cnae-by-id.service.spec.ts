import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeModule } from '../../../cnae.module';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import { CnaeDto } from '../../dtos/cnae.dto';
import { FindCnaeById } from './find-cnae-by-id.service';

describe('FindCnaeById - Integration tests', () => {
  let sut: FindCnaeById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeModule],
    }).compile();

    sut = module.get(FindCnaeById);
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
    await expect(sut.execute(id)).rejects.toThrow('CNAE não encontrado na base de dados.');
  });

  it('should throw CnaeNotFoundError when cnae is inactive and onlyActive is true', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act & Assert
    await expect(sut.execute(cnae.id, true)).rejects.toThrow(CnaeNotFoundError);
    await expect(sut.execute(cnae.id, true)).rejects.toThrow('CNAE não encontrado na base de dados.');
  });

  it('should return cnae by id', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Fabricação', active: true },
    });

    // Act
    const result = await sut.execute(cnae.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(cnae.id);
    expect(result.code).toBe(cnae.code);
    expect(result.description).toBe(cnae.description);
    expect(result.active).toBe(cnae.active);
  });

  it('should return all cnae fields correctly', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: false },
    });

    // Act
    const result = await sut.execute(cnae.id);

    // Assert
    expect(result).toEqual<CnaeDto>({
      id: cnae.id,
      code: cnae.code,
      description: cnae.description,
      active: cnae.active,
      createdAt: cnae.createdAt,
      updatedAt: cnae.updatedAt,
    });
  });
});
