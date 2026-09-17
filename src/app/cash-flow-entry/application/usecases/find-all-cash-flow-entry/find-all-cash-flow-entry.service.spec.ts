import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { TOKENS } from 'src/core/di/token';
import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { FindAllCashFlowEntryQueryDto } from './dtos/find-all-cash-flow-entry.dto';
import { FindAllCashFlowEntry } from './find-all-cash-flow-entry.service';

describe('FindAllCashFlowEntry - Unit tests', () => {
  let sut: FindAllCashFlowEntry;
  let dao: ICashFlowEntryDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllCashFlowEntry,
        { provide: TOKENS.CashFlowEntryDao, useValue: createMock<ICashFlowEntryDao>() },
      ],
    }).compile();

    sut = module.get(FindAllCashFlowEntry);
    dao = module.get(TOKENS.CashFlowEntryDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call dao.findAll with the query', async() => {
    // Arrange
    const query: FindAllCashFlowEntryQueryDto = {
      companyId: 1,
      page: 1,
      size: 10,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      type: CashFlowEntryType.CREDIT,
    };
    jest.spyOn(dao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    await sut.execute(query);

    // Assert
    expect(dao.findAll).toHaveBeenCalledWith(query);
  });

  it('should return paginated result', async() => {
    // Arrange
    const query: FindAllCashFlowEntryQueryDto = { companyId: 1, page: 1, size: 10 };
    const row = createMock<CashFlowEntryDto>();
    jest.spyOn(dao, 'findAll').mockResolvedValue([[row], 1]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([row]);
    expect(result.totalItems).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
