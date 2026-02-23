import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { EditFaqInputDto } from './dtos/edit-faq.dto';
import { EditFaq } from './edit-faq.service';

describe('EditFaq - Unit tests', () => {
  let sut: EditFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditFaq,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(EditFaq);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw FaqNotFoundError when faq does not exist', async() => {
    // Arrange
    const id = 0;
    const data: EditFaqInputDto = { question: 'Nova pergunta' };
    jest.spyOn(faqDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(FaqNotFoundError);
  });

  it('should call faqDao.findById to validate existence', async() => {
    // Arrange
    const id = 1;
    const data: EditFaqInputDto = { question: 'Nova pergunta' };
    jest.spyOn(faqDao, 'findById').mockResolvedValue(createMock<FaqDto>());
    const findByIdSpy = jest.spyOn(faqDao, 'findById');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call faqDao.edit with id and data', async() => {
    // Arrange
    const id = 1;
    const data: EditFaqInputDto = { question: 'Nova pergunta', answer: 'Nova resposta' };
    jest.spyOn(faqDao, 'findById').mockResolvedValue(createMock<FaqDto>());
    const editSpy = jest.spyOn(faqDao, 'edit');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(editSpy).toHaveBeenCalledWith(id, data);
    expect(editSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    const data: EditFaqInputDto = { question: 'Nova pergunta' };
    jest.spyOn(faqDao, 'findById').mockResolvedValue(createMock<FaqDto>());

    // Act
    const result = await sut.execute(id, data);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'FAQ atualizado com sucesso',
    });
  });

  it('should not call edit when faq does not exist', async() => {
    // Arrange
    const id = 0;
    const data: EditFaqInputDto = { question: 'Nova pergunta' };
    jest.spyOn(faqDao, 'findById').mockResolvedValue(null);
    const editSpy = jest.spyOn(faqDao, 'edit');

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(FaqNotFoundError);
    expect(editSpy).not.toHaveBeenCalled();
  });
});
