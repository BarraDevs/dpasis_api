import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { FaqModule } from 'src/app/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { UpdateFaqStatus } from './update-faq-status.service';

describe('UpdateFaqStatus - Integration tests', () => {
  let sut: UpdateFaqStatus;
  let prisma: PrismaService;

  const createFaq = async(active: boolean = true) => {
    return prisma.faq.create({
      data: {
        question: 'Pergunta teste?',
        answer: 'Resposta teste.',
        active,
      },
    });
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(UpdateFaqStatus);
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
    const id = 0;

    await expect(sut.execute(id)).rejects.toThrow(FaqNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const faq = await createFaq();

    await sut.execute(faq.id);

    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const faq = await createFaq(false);

    await sut.execute(faq.id);

    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const faq = await createFaq();

    const result = await sut.execute(faq.id);

    expect(result).toEqual({ message: 'Status da FAQ atualizado com sucesso' });
  });
});
