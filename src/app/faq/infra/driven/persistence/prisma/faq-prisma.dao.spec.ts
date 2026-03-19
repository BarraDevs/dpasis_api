import { Test } from '@nestjs/testing';
import { FaqDto } from 'src/app/faq/application/dtos/faq.dto';
import { CreateFaqInputDto } from 'src/app/faq/application/usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from 'src/app/faq/application/usecases/edit-faq/dtos/edit-faq.dto';
import { FindAllFaqQueryDto } from 'src/app/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FaqDaoAdapterPrisma } from './faq-prisma.dao';

describe('FaqDaoAdapterPrisma - Integration tests', () => {
  let sut: FaqDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [FaqDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(FaqDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no faqs exist', async() => {
      // Arrange
      const query: FindAllFaqQueryDto = {};

      // Act
      const [faqs, total] = await sut.findAll(query);

      // Assert
      expect(faqs).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all faqs with default pagination', async() => {
      // Arrange
      await prisma.faq.createMany({
        data: [
          { question: 'P1?', answer: 'R1.' },
          { question: 'P2?', answer: 'R2.' },
        ],
      });
      const query: FindAllFaqQueryDto = {};

      // Act
      const [faqs, total] = await sut.findAll(query);

      // Assert
      expect(faqs).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.faq.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          question: `P${i + 1}?`,
          answer: `R${i + 1}.`,
        })),
      });

      // Act
      const [faqs, total] = await sut.findAll({ page: 1, size: 10 });
      const [faqs2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(faqs).toHaveLength(10);
      expect(total).toBe(25);
      expect(faqs2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in question field (case-insensitive)', async() => {
      // Arrange
      await prisma.faq.createMany({
        data: [
          { question: 'Como recuperar senha?', answer: 'Clique em esqueci.' },
          { question: 'Qual horário?', answer: '8h às 18h.' },
        ],
      });
      const query: FindAllFaqQueryDto = { search: 'senha' };

      // Act
      const [faqs, total] = await sut.findAll(query);

      // Assert
      expect(faqs).toHaveLength(1);
      expect(total).toBe(1);
      expect(faqs[0].question).toBe('Como recuperar senha?');
    });

    it('should search in answer field (case-insensitive)', async() => {
      // Arrange
      await prisma.faq.createMany({
        data: [
          { question: 'P1?', answer: 'Resposta sobre login.' },
          { question: 'P2?', answer: 'Resposta sobre cadastro.' },
        ],
      });
      const query: FindAllFaqQueryDto = { search: 'login' };

      // Act
      const [faqs, total] = await sut.findAll(query);

      // Assert
      expect(faqs).toHaveLength(1);
      expect(total).toBe(1);
      expect(faqs[0].answer).toBe('Resposta sobre login.');
    });

    it('should search in both question and answer', async() => {
      // Arrange
      await prisma.faq.createMany({
        data: [
          { question: 'Pergunta sobre senha?', answer: 'Resposta.' },
          { question: 'Outra pergunta?', answer: 'Resposta sobre senha.' },
        ],
      });
      const query: FindAllFaqQueryDto = { search: 'senha' };

      // Act
      const [faqs, total] = await sut.findAll(query);

      // Assert
      expect(faqs).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should return results ordered by createdAt desc', async() => {
      // Arrange
      const faq1 = await prisma.faq.create({
        data: { question: 'Primeira?', answer: 'Primeira.' },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const faq2 = await prisma.faq.create({
        data: { question: 'Segunda?', answer: 'Segunda.' },
      });
      const query: FindAllFaqQueryDto = {};

      // Act
      const [faqs] = await sut.findAll(query);

      // Assert
      expect(faqs).toHaveLength(2);
      expect(faqs[0].id).toBe(faq2.id);
      expect(faqs[1].id).toBe(faq1.id);
    });

    it('should filter by active when provided', async() => {
      // Arrange
      await prisma.faq.createMany({
        data: [
          { question: 'P1?', answer: 'R1.', active: true },
          { question: 'P2?', answer: 'R2.', active: false },
        ],
      });
      const queryActive: FindAllFaqQueryDto = { active: true };
      const queryInactive: FindAllFaqQueryDto = { active: false };

      // Act
      const [faqsActive, totalActive] = await sut.findAll(queryActive);
      const [faqsInactive, totalInactive] = await sut.findAll(queryInactive);

      // Assert
      expect(faqsActive).toHaveLength(1);
      expect(totalActive).toBe(1);
      expect(faqsActive[0].active).toBe(true);
      expect(faqsInactive).toHaveLength(1);
      expect(totalInactive).toBe(1);
      expect(faqsInactive[0].active).toBe(false);
    });

    it('should return all faq fields correctly', async() => {
      // Arrange
      const created = await prisma.faq.create({
        data: { question: 'Test?', answer: 'Test answer.' },
      });
      const query: FindAllFaqQueryDto = {};

      // Act
      const [faqs] = await sut.findAll(query);

      // Assert
      expect(faqs).toHaveLength(1);
      expect(faqs[0]).toEqual<FaqDto>({
        id: created.id,
        question: created.question,
        answer: created.answer,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when faq does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return faq by id', async() => {
      // Arrange
      const created = await prisma.faq.create({
        data: { question: 'Test?', answer: 'Test answer.' },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.question).toBe('Test?');
      expect(result?.answer).toBe('Test answer.');
    });

    it('should return all faq fields correctly', async() => {
      // Arrange
      const created = await prisma.faq.create({
        data: { question: 'Test?', answer: 'Test answer.' },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<FaqDto>({
        id: created.id,
        question: created.question,
        answer: created.answer,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('save', () => {
    it('should create faq and return id', async() => {
      // Arrange
      const data: CreateFaqInputDto = {
        question: 'Como recuperar senha?',
        answer: 'Clique em esqueci.',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.faq.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.question).toBe(data.question);
      expect(saved?.answer).toBe(data.answer);
    });
  });

  describe('edit', () => {
    it('should update faq question', async() => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'Original?', answer: 'Original answer.' },
      });
      const data: EditFaqInputDto = { question: 'Updated?' };

      // Act
      await sut.edit(faq.id, data);

      // Assert
      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.question).toBe('Updated?');
      expect(updated?.answer).toBe('Original answer.');
    });

    it('should update faq answer', async() => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'Original?', answer: 'Original answer.' },
      });
      const data: EditFaqInputDto = { answer: 'Updated answer.' };

      // Act
      await sut.edit(faq.id, data);

      // Assert
      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.question).toBe('Original?');
      expect(updated?.answer).toBe('Updated answer.');
    });

    it('should update both question and answer', async() => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.' },
      });
      const data: EditFaqInputDto = {
        question: 'New question?',
        answer: 'New answer.',
      };

      // Act
      await sut.edit(faq.id, data);

      // Assert
      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.question).toBe('New question?');
      expect(updated?.answer).toBe('New answer.');
    });
  });

  describe('delete', () => {
    it('should delete faq from database', async() => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.' },
      });

      // Act
      await sut.delete(faq.id);

      // Assert
      const deleted = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update active from true to false', async() => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.', active: true },
      });

      // Act
      await sut.updateStatus(faq.id, false);

      // Assert
      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.active).toBe(false);
    });

    it('should update active from false to true', async() => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.', active: false },
      });

      // Act
      await sut.updateStatus(faq.id, true);

      // Assert
      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.active).toBe(true);
    });

    it.each([true, false])('should not change active when it is already the same value (%s)', async(active) => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.', active },
      });

      // Act
      await sut.updateStatus(faq.id, active);

      // Assert
      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.active).toBe(active);
    });

    it('should not change other faq fields', async() => {
      // Arrange
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.', active: true },
      });

      // Act
      await sut.updateStatus(faq.id, false);

      // Assert
      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.question).toBe('P?');
      expect(updated?.answer).toBe('R.');
      expect(updated?.active).toBe(false);
    });
  });
});
