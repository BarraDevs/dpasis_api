import { Test } from '@nestjs/testing';
import { FaqModule } from 'src/app/global/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateFaq } from './create-faq.service';
import { CreateFaqInputDto } from './dtos/create-faq.dto';

describe('CreateFaq - Integration tests', () => {
  let sut: CreateFaq;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(CreateFaq);
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

  it('should create faq and return id', async() => {
    // Arrange
    const input: CreateFaqInputDto = {
      question: 'Como recuperar minha senha?',
      answer: 'Clique em "Esqueci minha senha" na tela de login.',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.faq.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.question).toBe(input.question);
    expect(saved?.answer).toBe(input.answer);
  });

  it('should persist faq in database', async() => {
    // Arrange
    const input: CreateFaqInputDto = {
      question: 'Qual o horário de funcionamento?',
      answer: 'Segunda a sexta, das 8h às 18h.',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const faq = await prisma.faq.findUnique({ where: { id } });
    expect(faq).toEqual(
      expect.objectContaining({
        id,
        question: input.question,
        answer: input.answer,
      }),
    );
    expect(faq?.createdAt).toBeInstanceOf(Date);
    expect(faq?.updatedAt).toBeInstanceOf(Date);
  });
});
