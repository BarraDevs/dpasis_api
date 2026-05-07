import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import { SearchClientInputDto } from './dtos/search-client.dto';
import { SearchClient } from './search-client.service';

describe('SearchClient - Unit tests', () => {
  let sut: SearchClient;
  let clientDao: IClientDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        SearchClient,
        { provide: TOKENS.ClientDao, useValue: createMock<IClientDao>() },
      ],
    }).compile();

    sut = module.get(SearchClient);
    clientDao = module.get(TOKENS.ClientDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should delegate to dao.search and return pagination dto', async() => {
    const input = new SearchClientInputDto();
    input.page = 1;
    input.size = 10;
    const row: ClientDto = { id: 1 } as ClientDto;
    (clientDao.search as jest.Mock).mockResolvedValue([[row], 1]);

    const result = await sut.execute(input);

    expect(clientDao.search).toHaveBeenCalledWith(input);
    expect(result.data).toEqual([row]);
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
  });

  it('should apply Pagination defaults when page and size are omitted', async() => {
    // Arrange
    const input = new SearchClientInputDto();
    input.filter = {};
    const rows: ClientDto[] = [{ id: 1 }, { id: 2 }, { id: 3 }] as ClientDto[];
    jest.spyOn(clientDao, 'search').mockResolvedValue([rows, 3]);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(clientDao.search).toHaveBeenCalledWith(input);
    expect(result.data).toEqual(rows);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(3);
    expect(result.totalPages).toBe(1);
  });
});
