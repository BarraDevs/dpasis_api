import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ProviderItemDto } from '../../dtos/provider-item.dto';
import type { IProviderItemDao } from '../../persistence/dao/provider-item-dao.interface';
import { FindAllProviderItem } from './find-all-provider-item.service';

describe('FindAllProviderItem - Unit tests', () => {
  let sut: FindAllProviderItem;
  let providerItemDao: IProviderItemDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllProviderItem,
        {
          provide: TOKENS.ProviderItemDao,
          useValue: createMock<IProviderItemDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllProviderItem);
    providerItemDao = module.get(TOKENS.ProviderItemDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should delegate to dao and return pagination dto', async() => {
    // Arrange
    const mockRows = [createMock<ProviderItemDto>({ id: 1, description: 'Serviço' })];
    jest.spyOn(providerItemDao, 'findAll').mockResolvedValue([mockRows, 1]);

    // Act
    const result = await sut.execute({ providerId: 1, page: 1, size: 10 });

    // Assert
    expect(providerItemDao.findAll).toHaveBeenCalledWith({ providerId: 1, page: 1, size: 10 });
    expect(result.data).toEqual(mockRows);
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
  });
});
