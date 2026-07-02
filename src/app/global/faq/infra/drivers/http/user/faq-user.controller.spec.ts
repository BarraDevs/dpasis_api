import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqDto } from 'src/app/global/faq/application/dtos/faq.dto';
import { FindAllFaqQueryDto } from 'src/app/global/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { FindAllFaq } from 'src/app/global/faq/application/usecases/find-all-faq/find-all-faq.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FaqUserController } from './faq-user.controller';

describe('FaqUserController - Unit tests', () => {
  let sut: FaqUserController;
  let findAllFaqService: FindAllFaq;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      controllers: [FaqUserController],
      providers: [
        { provide: FindAllFaq, useValue: createMock<FindAllFaq>() },
      ],
    }).compile();

    sut = module.get(FaqUserController);
    findAllFaqService = module.get(FindAllFaq);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAllFaq.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllFaqQueryDto>();
      const output = createMock<IPagination<FaqDto>>();
      const findAllSpy = jest.spyOn(findAllFaqService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return paginated result', async() => {
      // Arrange
      const queries = createMock<FindAllFaqQueryDto>({ page: 1, size: 10 });
      const output: IPagination<FaqDto> = {
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 10,
      };
      jest.spyOn(findAllFaqService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
    });
  });
});
