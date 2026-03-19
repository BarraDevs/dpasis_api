import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { FaqModule } from 'src/app/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FaqDto } from '../../dtos/faq.dto';
import { FindFaqById } from './find-faq-by-id.service';

describe('FindFaqById - Integration tests', () => {
  let sut: FindFaqById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(FindFaqById);
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

  it('should throw FaqNotFoundError when faq does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(FaqNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('FAQ não encontrado na base de dados.');
  });

  it('should return faq by id', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'Como recuperar senha?', answer: 'Clique em esqueci.' },
    });

    // Act
    const result = await sut.execute(faq.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(faq.id);
    expect(result.question).toBe(faq.question);
    expect(result.answer).toBe(faq.answer);
  });

  it('should return all faq fields correctly', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'Test?', answer: 'Test answer.' },
    });

    // Act
    const result = await sut.execute(faq.id);

    // Assert
    expect(result).toEqual<FaqDto>({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      active: faq.active,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    });
  });
});
