import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SellerDto } from '../../dtos/seller.dto';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import { FindSellerById } from './find-seller-by-id.service';

describe('FindSellerById - Unit tests', () => {
  let sut: FindSellerById;
  let sellerDao: ISellerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindSellerById,
        { provide: TOKENS.SellerDao, useValue: createMock<ISellerDao>() },
      ],
    }).compile();

    sut = module.get(FindSellerById);
    sellerDao = module.get(TOKENS.SellerDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call sellerDao.findById with correct id', async() => {
    // Arrange
    const id = 1;
    const mockSeller = createMock<SellerDto>({ id, name: 'João Silva' });
    jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSeller);
    const findByIdSpy = jest.spyOn(sellerDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should return seller when found', async() => {
    // Arrange
    const mockSeller = createMock<SellerDto>({ id: 1, name: 'João Silva' });
    jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSeller);

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual(mockSeller);
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    // Arrange
    jest.spyOn(sellerDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(999)).rejects.toThrow(SellerNotFoundError);
    await expect(sut.execute(999)).rejects.toThrow('Vendedor não encontrado na base de dados.');
  });

  it('should throw SellerNotFoundError when onlyActive and seller is inactive', async() => {
    // Arrange
    const mockSeller = createMock<SellerDto>({ id: 1, active: false });
    jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSeller);

    // Act & Assert
    await expect(sut.execute(1, { onlyActive: true })).rejects.toThrow(SellerNotFoundError);
  });

  it('should return inactive seller when onlyActive is not set', async() => {
    // Arrange
    const mockSeller = createMock<SellerDto>({ id: 1, active: false });
    jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSeller);

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result.active).toBe(false);
  });
});
