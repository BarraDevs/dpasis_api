import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ProviderItemDto } from '../../dtos/provider-item.dto';
import type { IProviderItemDao } from '../../persistence/dao/provider-item-dao.interface';
import { FindProviderItemById } from './find-provider-item-by-id.service';

describe('FindProviderItemById - Unit tests', () => {
  let sut: FindProviderItemById;
  let providerItemDao: IProviderItemDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindProviderItemById,
        {
          provide: TOKENS.ProviderItemDao,
          useValue: createMock<IProviderItemDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindProviderItemById);
    providerItemDao = module.get(TOKENS.ProviderItemDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call providerItemDao.findById with correct id', async() => {
    // Arrange
    const id = 1;
    const mockItem = createMock<ProviderItemDto>();
    jest.spyOn(providerItemDao, 'findById').mockResolvedValue(mockItem);
    const findByIdSpy = jest.spyOn(providerItemDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(providerItemDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ProviderItemNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Item do prestador não encontrado.');
  });

  it('should return item when found', async() => {
    // Arrange
    const id = 1;
    const mockItem = createMock<ProviderItemDto>({
      id,
      description: 'Serviço de manutenção',
    });
    jest.spyOn(providerItemDao, 'findById').mockResolvedValue(mockItem);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual(mockItem);
    expect(result.id).toBe(id);
    expect(result.description).toBe('Serviço de manutenção');
  });
});
