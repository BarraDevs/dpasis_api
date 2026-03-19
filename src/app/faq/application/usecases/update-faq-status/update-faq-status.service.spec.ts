import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { UpdateFaqStatus } from './update-faq-status.service';

describe('UpdateFaqStatus - Unit tests', () => {
  let sut: UpdateFaqStatus;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateFaqStatus,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(UpdateFaqStatus);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call faqDao.findById with correct id', async() => {
    // Arrange
    const id = 1;
    const mockFaq = createMock<FaqDto>({ id, active: true });
    jest.spyOn(faqDao, 'findById').mockResolvedValue(mockFaq);
    jest.spyOn(faqDao, 'updateStatus').mockResolvedValue();
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

  it('should call faqDao.updateStatus with inverted active when faq is active', async() => {
    // Arrange
    const id = 1;
    const mockFaq = createMock<FaqDto>({ id, active: true });
    jest.spyOn(faqDao, 'findById').mockResolvedValue(mockFaq);
    const updateStatusSpy = jest.spyOn(faqDao, 'updateStatus').mockResolvedValue();

    // Act
    await sut.execute(id);

    // Assert
    expect(updateStatusSpy).toHaveBeenCalledWith(id, false);
    expect(updateStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should call faqDao.updateStatus with inverted active when faq is inactive', async() => {
    // Arrange
    const id = 1;
    const mockFaq = createMock<FaqDto>({ id, active: false });
    jest.spyOn(faqDao, 'findById').mockResolvedValue(mockFaq);
    const updateStatusSpy = jest.spyOn(faqDao, 'updateStatus').mockResolvedValue();

    // Act
    await sut.execute(id);

    // Assert
    expect(updateStatusSpy).toHaveBeenCalledWith(id, true);
    expect(updateStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    const mockFaq = createMock<FaqDto>({ id, active: true });
    jest.spyOn(faqDao, 'findById').mockResolvedValue(mockFaq);
    jest.spyOn(faqDao, 'updateStatus').mockResolvedValue();

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual({ message: 'Status da FAQ atualizado com sucesso' });
  });
});
