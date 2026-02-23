import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { FindAllClientGroupQueryDto } from './dtos/find-all-client-group.dto';
import { FindAllClientGroup } from './find-all-client-group.service';

describe('FindAllClientGroup - Unit tests', () => {
  let sut: FindAllClientGroup;
  let clientGroupDao: IClientGroupDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllClientGroup,
        {
          provide: TOKENS.ClientGroupDao,
          useValue: createMock<IClientGroupDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllClientGroup);
    clientGroupDao = module.get(TOKENS.ClientGroupDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientGroupDao.findAll with correct query', async() => {
    // Arrange
    const query: FindAllClientGroupQueryDto = { page: 1, size: 10 };
    jest.spyOn(clientGroupDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(clientGroupDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
    expect(findAllSpy).toHaveBeenCalledTimes(1);
  });

  it('should return paginated result', async() => {
    // Arrange
    const query: FindAllClientGroupQueryDto = { page: 1, size: 10 };
    const mockClientGroup = createMock<ClientGroupDto>();
    jest.spyOn(clientGroupDao, 'findAll').mockResolvedValue([[mockClientGroup], 1]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result).toBeDefined();
    expect(result.data).toEqual([mockClientGroup]);
    expect(result.totalItems).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it('should handle empty result', async() => {
    // Arrange
    const query: FindAllClientGroupQueryDto = { page: 1, size: 10 };
    jest.spyOn(clientGroupDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should pass search to clientGroupDao', async() => {
    // Arrange
    const query: FindAllClientGroupQueryDto = { page: 1, size: 20, search: 'Premium' };
    jest.spyOn(clientGroupDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(clientGroupDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
  });

  it('should use Pagination for multiple pages', async() => {
    // Arrange
    const query: FindAllClientGroupQueryDto = { page: 3, size: 15 };
    const mockClientGroups = Array(15).fill(createMock<ClientGroupDto>());
    jest.spyOn(clientGroupDao, 'findAll').mockResolvedValue([mockClientGroups, 100]);

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
