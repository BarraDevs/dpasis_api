import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { FindAllClientOwnerQueryDto } from './dtos/find-all-client-owner.dto';
import { FindAllClientOwner } from './find-all-client-owner.service';

describe('FindAllClientOwner - Unit tests', () => {
  let sut: FindAllClientOwner;
  let clientOwnerDao: IClientOwnerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllClientOwner,
        {
          provide: TOKENS.ClientOwnerDao,
          useValue: createMock<IClientOwnerDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllClientOwner);
    clientOwnerDao = module.get(TOKENS.ClientOwnerDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientOwnerDao.findAll with correct query', async() => {
    // Arrange
    const query: FindAllClientOwnerQueryDto = { page: 1, size: 10 };
    jest.spyOn(clientOwnerDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(clientOwnerDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
    expect(findAllSpy).toHaveBeenCalledTimes(1);
  });

  it('should return paginated result', async() => {
    // Arrange
    const query: FindAllClientOwnerQueryDto = { page: 1, size: 10 };
    const mockClientOwner = createMock<ClientOwnerDto>();
    jest.spyOn(clientOwnerDao, 'findAll').mockResolvedValue([[mockClientOwner], 1]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result).toBeDefined();
    expect(result.data).toEqual([mockClientOwner]);
    expect(result.totalItems).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it('should handle empty result', async() => {
    // Arrange
    const query: FindAllClientOwnerQueryDto = { page: 1, size: 10 };
    jest.spyOn(clientOwnerDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should pass search to clientOwnerDao', async() => {
    // Arrange
    const query: FindAllClientOwnerQueryDto = { page: 1, size: 20, search: 'Premium' };
    jest.spyOn(clientOwnerDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(clientOwnerDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
  });

  it('should use Pagination for multiple pages', async() => {
    // Arrange
    const query: FindAllClientOwnerQueryDto = { page: 3, size: 15 };
    const mockClientOwners = Array(15).fill(createMock<ClientOwnerDto>());
    jest.spyOn(clientOwnerDao, 'findAll').mockResolvedValue([mockClientOwners, 100]);

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
