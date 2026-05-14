import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ClientInvoiceConfigDto } from '../../dtos/client-invoice-config.dto';
import type { IClientInvoiceConfigDao } from '../../persistence/dao/client-invoice-config-dao.interface';
import { FindAllClientInvoiceConfigQueryDto } from './dtos/find-all-client-invoice-config.dto';
import { FindAllClientInvoiceConfig } from './find-all-client-invoice-config.service';

describe('FindAllClientInvoiceConfig - Unit tests', () => {
  let sut: FindAllClientInvoiceConfig;
  let clientInvoiceConfigDao: IClientInvoiceConfigDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllClientInvoiceConfig,
        {
          provide: TOKENS.ClientInvoiceConfigDao,
          useValue: createMock<IClientInvoiceConfigDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllClientInvoiceConfig);
    clientInvoiceConfigDao = module.get(TOKENS.ClientInvoiceConfigDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientInvoiceConfigDao.findAll with correct query', async() => {
    // Arrange
    const query: FindAllClientInvoiceConfigQueryDto = { page: 1, size: 10 };
    jest.spyOn(clientInvoiceConfigDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(clientInvoiceConfigDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
    expect(findAllSpy).toHaveBeenCalledTimes(1);
  });

  it('should return paginated result', async() => {
    // Arrange
    const query: FindAllClientInvoiceConfigQueryDto = { page: 1, size: 10 };
    const mockRow = createMock<ClientInvoiceConfigDto>();
    jest.spyOn(clientInvoiceConfigDao, 'findAll').mockResolvedValue([[mockRow], 1]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result).toBeDefined();
    expect(result.data).toEqual([mockRow]);
    expect(result.totalItems).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it('should handle empty result', async() => {
    // Arrange
    const query: FindAllClientInvoiceConfigQueryDto = { page: 1, size: 10 };
    jest.spyOn(clientInvoiceConfigDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should pass dueDateDay filter to dao', async() => {
    // Arrange
    const query: FindAllClientInvoiceConfigQueryDto = { page: 1, size: 20, dueDateDay: 15 };
    jest.spyOn(clientInvoiceConfigDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(clientInvoiceConfigDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
  });

  it('should pass generateNf filter to dao', async() => {
    // Arrange
    const query: FindAllClientInvoiceConfigQueryDto = { page: 1, size: 20, generateNf: false };
    jest.spyOn(clientInvoiceConfigDao, 'findAll').mockResolvedValue([[], 0]);
    const findAllSpy = jest.spyOn(clientInvoiceConfigDao, 'findAll');

    // Act
    await sut.execute(query);

    // Assert
    expect(findAllSpy).toHaveBeenCalledWith(query);
  });
});
