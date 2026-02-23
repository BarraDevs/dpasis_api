import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { CreateFaq } from './create-faq.service';
import { CreateFaqInputDto, CreateFaqOutputDto } from './dtos/create-faq.dto';

function makeValidCreateFaqInput(overrides: Partial<CreateFaqInputDto> = {}): CreateFaqInputDto {
  return {
    question: 'Como faço para recuperar minha senha?',
    answer: 'Clique em "Esqueci minha senha" na tela de login.',
    ...overrides,
  };
}

describe('CreateFaq - Unit tests', () => {
  let sut: CreateFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateFaq,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateFaq);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call faqDao.save with correct data', async() => {
    // Arrange
    const input = makeValidCreateFaqInput();
    const saveSpy = jest.spyOn(faqDao, 'save').mockResolvedValue(1);

    // Act
    await sut.execute(input);

    // Assert
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(input);
  });

  it('should return id from faqDao.save', async() => {
    // Arrange
    const input = makeValidCreateFaqInput();
    const id = 1;
    jest.spyOn(faqDao, 'save').mockResolvedValue(id);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result).toEqual<CreateFaqOutputDto>({ id });
  });

  it('should pass question and answer to save', async() => {
    // Arrange
    const input = makeValidCreateFaqInput({
      question: 'Qual o horário de funcionamento?',
      answer: 'Segunda a sexta, das 8h às 18h.',
    });
    const saveSpy = jest.spyOn(faqDao, 'save').mockResolvedValue(1);

    // Act
    await sut.execute(input);

    // Assert
    expect(saveSpy).toHaveBeenCalledWith({
      question: 'Qual o horário de funcionamento?',
      answer: 'Segunda a sexta, das 8h às 18h.',
    });
  });
});
