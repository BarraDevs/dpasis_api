import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { FindAllFaqQueryDto } from './dtos/find-all-faq.dto';
import { FindAllFaq } from './find-all-faq.service';

describe('FindAllFaq - Unit tests', () => {
  let sut: FindAllFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllFaq,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllFaq);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call faqDao.findAll with correct query', async() => {
    // Arrange
    const query: FindAllFaqQueryDto = { page: 1, size: 10 };
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(faqDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
    expect(findAllSpy).toHaveBeenCalledTimes(1);
  });

  it('should return paginated result', async() => {
    // Arrange
    const query: FindAllFaqQueryDto = { page: 1, size: 10 };
    const mockFaq = createMock<FaqDto>();
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([[mockFaq], 1]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result).toBeDefined();
    expect(result.data).toEqual([mockFaq]);
    expect(result.totalItems).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it('should handle empty result', async() => {
    // Arrange
    const query: FindAllFaqQueryDto = { page: 1, size: 10 };
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should pass search to faqDao', async() => {
    // Arrange
    const query: FindAllFaqQueryDto = { page: 1, size: 20, search: 'senha' };
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(faqDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
  });

  it('should use Pagination for multiple pages', async() => {
    // Arrange
    const query: FindAllFaqQueryDto = { page: 3, size: 15 };
    const mockFaqs = Array(15).fill(createMock<FaqDto>());
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([mockFaqs, 100]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.currentPage).toBe(3);
    expect(result.itemsPerPage).toBe(15);
    expect(result.totalPages).toBe(7);
    expect(result.totalItems).toBe(100);
    expect(result.data).toHaveLength(15);
  });
});
