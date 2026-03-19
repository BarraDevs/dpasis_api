import { Test } from '@nestjs/testing';
import { FaqModule } from 'src/app/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FaqDto } from '../../dtos/faq.dto';
import { FindAllFaqQueryDto } from './dtos/find-all-faq.dto';
import { FindAllFaq } from './find-all-faq.service';

describe('FindAllFaq - Integration tests', () => {
  let sut: FindAllFaq;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(FindAllFaq);
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

  it('should return empty results when no faqs exist', async() => {
    // Arrange
    const query: FindAllFaqQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all faqs with pagination', async() => {
    // Arrange
    await prisma.faq.createMany({
      data: [
        { question: 'Pergunta 1?', answer: 'Resposta 1.' },
        { question: 'Pergunta 2?', answer: 'Resposta 2.' },
        { question: 'Pergunta 3?', answer: 'Resposta 3.' },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    // Arrange
    await prisma.faq.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        question: `Pergunta ${i + 1}?`,
        answer: `Resposta ${i + 1}.`,
      })),
    });

    // Act
    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    // Assert
    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by createdAt desc', async() => {
    // Arrange
    const first = await prisma.faq.create({
      data: { question: 'Primeira?', answer: 'Primeira.' },
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const second = await prisma.faq.create({
      data: { question: 'Segunda?', answer: 'Segunda.' },
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const third = await prisma.faq.create({
      data: { question: 'Terceira?', answer: 'Terceira.' },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].id).toBe(third.id);
    expect(result.data[1].id).toBe(second.id);
    expect(result.data[2].id).toBe(first.id);
  });

  it('should filter by search in question', async() => {
    // Arrange
    await prisma.faq.createMany({
      data: [
        { question: 'Como recuperar senha?', answer: 'Clique em esqueci.' },
        { question: 'Qual horário?', answer: '8h às 18h.' },
        { question: 'Como alterar senha?', answer: 'No menu configurações.' },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'senha' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((f: FaqDto) => f.question.toLowerCase().includes('senha'))).toBe(true);
  });

  it('should filter by search in answer', async() => {
    // Arrange
    await prisma.faq.createMany({
      data: [
        { question: 'P1?', answer: 'Resposta sobre login.' },
        { question: 'P2?', answer: 'Resposta sobre cadastro.' },
        { question: 'P3?', answer: 'Outra resposta sobre login.' },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'login' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((f: FaqDto) => f.answer.toLowerCase().includes('login'))).toBe(true);
  });

  it('should return correct FaqDto structure', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'Test?', answer: 'Test answer.' },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<FaqDto>({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      active: faq.active,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    });
  });
});
