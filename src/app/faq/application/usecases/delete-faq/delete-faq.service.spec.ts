import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { DeleteFaq } from './delete-faq.service';

describe('DeleteFaq - Unit tests', () => {
  let sut: DeleteFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteFaq,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteFaq);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw FaqNotFoundError when faq does not exist', async() => {
    // Arrange
    const id = 'non-existing-id';
    jest.spyOn(faqDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(FaqNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('FAQ não encontrado na base de dados.');
  });

  it('should call faqDao.findById to validate existence', async() => {
    // Arrange
    const id = 'faq-id';
    jest.spyOn(faqDao, 'findById').mockResolvedValue(createMock<FaqDto>());
    const findByIdSpy = jest.spyOn(faqDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call faqDao.delete with correct id', async() => {
    // Arrange
    const id = 'faq-id';
    jest.spyOn(faqDao, 'findById').mockResolvedValue(createMock<FaqDto>());
    const deleteSpy = jest.spyOn(faqDao, 'delete');

    // Act
    await sut.execute(id);

    // Assert
    expect(deleteSpy).toHaveBeenCalledWith(id);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 'faq-id';
    jest.spyOn(faqDao, 'findById').mockResolvedValue(createMock<FaqDto>());

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'FAQ excluído com sucesso',
    });
  });

  it('should not call delete when faq does not exist', async() => {
    // Arrange
    const id = 'non-existing-id';
    jest.spyOn(faqDao, 'findById').mockResolvedValue(null);
    const deleteSpy = jest.spyOn(faqDao, 'delete');

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(FaqNotFoundError);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
