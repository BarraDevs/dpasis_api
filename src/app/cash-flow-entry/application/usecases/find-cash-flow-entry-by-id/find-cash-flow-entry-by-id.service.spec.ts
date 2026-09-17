import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { FindCashFlowEntryById } from './find-cash-flow-entry-by-id.service';

describe('FindCashFlowEntryById - Unit tests', () => {
  let sut: FindCashFlowEntryById;
  let dao: ICashFlowEntryDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindCashFlowEntryById,
        { provide: TOKENS.CashFlowEntryDao, useValue: createMock<ICashFlowEntryDao>() },
      ],
    }).compile();

    sut = module.get(FindCashFlowEntryById);
    dao = module.get(TOKENS.CashFlowEntryDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CashFlowEntryNotFoundError when the entry does not exist', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(0)).rejects.toThrow(CashFlowEntryNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow(
      'Lançamento de fluxo de caixa não encontrado na base de dados.',
    );
  });

  it('should return the entry when found', async() => {
    // Arrange
    const entry = createMock<CashFlowEntryDto>({ id: 7, description: 'Crédito' });
    jest.spyOn(dao, 'findById').mockResolvedValue(entry);

    // Act
    const result = await sut.execute(7);

    // Assert
    expect(dao.findById).toHaveBeenCalledWith(7);
    expect(result).toEqual(entry);
  });
});
