import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SellerDto } from '../../dtos/seller.dto';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import { FindAllSellerQueryDto } from './dtos/find-all-seller.dto';
import { FindAllSeller } from './find-all-seller.service';

describe('FindAllSeller - Unit tests', () => {
  let sut: FindAllSeller;
  let sellerDao: ISellerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllSeller,
        { provide: TOKENS.SellerDao, useValue: createMock<ISellerDao>() },
      ],
    }).compile();

    sut = module.get(FindAllSeller);
    sellerDao = module.get(TOKENS.SellerDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call sellerDao.findAll with correct query', async() => {
    // Arrange
    const query: FindAllSellerQueryDto = { page: 1, size: 10 };
    jest.spyOn(sellerDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(sellerDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
    expect(findAllSpy).toHaveBeenCalledTimes(1);
  });

  it('should return paginated result', async() => {
    // Arrange
    const query: FindAllSellerQueryDto = { page: 1, size: 10 };
    const mockSeller = createMock<SellerDto>({ name: 'João Silva' });
    jest.spyOn(sellerDao, 'findAll').mockResolvedValue([[mockSeller], 1]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([mockSeller]);
    expect(result.totalItems).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it('should handle empty result', async() => {
    // Arrange
    const query: FindAllSellerQueryDto = { page: 1, size: 10 };
    jest.spyOn(sellerDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should pass search and active filters to sellerDao', async() => {
    // Arrange
    const query: FindAllSellerQueryDto = { page: 1, size: 20, search: 'joão', active: true };
    jest.spyOn(sellerDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(sellerDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
  });

  it('should use Pagination for multiple pages', async() => {
    // Arrange
    const query: FindAllSellerQueryDto = { page: 2, size: 10 };
    const mockSellers = Array.from({ length: 10 }, () => createMock<SellerDto>());
    jest.spyOn(sellerDao, 'findAll').mockResolvedValue([mockSellers, 25]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.currentPage).toBe(2);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(3);
    expect(result.totalItems).toBe(25);
    expect(result.data).toHaveLength(10);
  });
});
