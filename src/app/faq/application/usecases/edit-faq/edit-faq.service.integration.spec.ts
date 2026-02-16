import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { FaqModule } from 'src/app/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditFaqInputDto } from './dtos/edit-faq.dto';
import { EditFaq } from './edit-faq.service';

describe('EditFaq - Integration tests', () => {
  let sut: EditFaq;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(EditFaq);
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
    const id = 'non-existing-id';
    const data: EditFaqInputDto = { question: 'Nova pergunta' };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(FaqNotFoundError);
  });

  it('should update faq question', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'Pergunta original?', answer: 'Resposta original.' },
    });
    const data: EditFaqInputDto = { question: 'Pergunta atualizada?' };

    // Act
    await sut.execute(faq.id, data);

    // Assert
    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(updated?.question).toBe('Pergunta atualizada?');
    expect(updated?.answer).toBe('Resposta original.');
  });

  it('should update faq answer', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'Pergunta?', answer: 'Resposta original.' },
    });
    const data: EditFaqInputDto = { answer: 'Resposta atualizada.' };

    // Act
    await sut.execute(faq.id, data);

    // Assert
    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(updated?.question).toBe('Pergunta?');
    expect(updated?.answer).toBe('Resposta atualizada.');
  });

  it('should update both question and answer', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'P1?', answer: 'R1.' },
    });
    const data: EditFaqInputDto = {
      question: 'Pergunta nova?',
      answer: 'Resposta nova.',
    };

    // Act
    await sut.execute(faq.id, data);

    // Assert
    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(updated?.question).toBe('Pergunta nova?');
    expect(updated?.answer).toBe('Resposta nova.');
  });

  it('should return success message', async() => {
    // Arrange
    const faq = await prisma.faq.create({
      data: { question: 'P?', answer: 'R.' },
    });
    const data: EditFaqInputDto = { question: 'Nova?' };

    // Act
    const result = await sut.execute(faq.id, data);

    // Assert
    expect(result).toEqual({ message: 'FAQ atualizado com sucesso' });
  });
});
