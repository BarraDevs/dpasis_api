import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { DeleteCashFlowEntry } from './delete-cash-flow-entry.service';

describe('DeleteCashFlowEntry - Unit tests', () => {
  let sut: DeleteCashFlowEntry;
  let dao: ICashFlowEntryDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteCashFlowEntry,
        { provide: TOKENS.CashFlowEntryDao, useValue: createMock<ICashFlowEntryDao>() },
      ],
    }).compile();

    sut = module.get(DeleteCashFlowEntry);
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
    expect(dao.delete).not.toHaveBeenCalled();
  });

  it('should delete and return success message', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<CashFlowEntryDto>({ id: 1 }));

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(dao.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual<SuccessMessage>({
      message: 'Lançamento de fluxo de caixa excluído com sucesso',
    });
  });
});
