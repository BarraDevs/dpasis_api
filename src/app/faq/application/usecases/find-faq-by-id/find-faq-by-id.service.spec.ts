import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { FindFaqById } from './find-faq-by-id.service';

describe('FindFaqById - Unit tests', () => {
  let sut: FindFaqById;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindFaqById,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindFaqById);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call faqDao.findById with correct id', async() => {
    // Arrange
    const id = 1;
    const mockFaq = createMock<FaqDto>();
    jest.spyOn(faqDao, 'findById').mockResolvedValue(mockFaq);
    const findByIdSpy = jest.spyOn(faqDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw FaqNotFoundError when faq does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(faqDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(FaqNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('FAQ não encontrado na base de dados.');
  });

  it('should return faq when found', async() => {
    // Arrange
    const id = 1;
    const mockFaq = createMock<FaqDto>({
      id,
      question: 'Pergunta?',
      answer: 'Resposta.',
    });
    jest.spyOn(faqDao, 'findById').mockResolvedValue(mockFaq);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual(mockFaq);
    expect(result.id).toBe(id);
    expect(result.question).toBe('Pergunta?');
    expect(result.answer).toBe('Resposta.');
  });
});
