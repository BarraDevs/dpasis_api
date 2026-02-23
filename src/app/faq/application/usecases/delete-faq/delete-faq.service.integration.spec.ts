import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { FaqModule } from 'src/app/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteFaq } from './delete-faq.service';

describe('DeleteFaq - Integration tests', () => {
  let sut: DeleteFaq;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(DeleteFaq);
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
  });

  it('should delete faq from database', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'Pergunta?', answer: 'Resposta.' },
    });

    // Act
    await sut.execute(faq.id);

    // Assert
    const deleted = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'P?', answer: 'R.' },
    });

    // Act
    const result = await sut.execute(faq.id);

    // Assert
    expect(result).toEqual({ message: 'FAQ excluído com sucesso' });
  });
});
