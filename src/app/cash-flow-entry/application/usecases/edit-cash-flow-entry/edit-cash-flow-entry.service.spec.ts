import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { EditCashFlowEntryInputDto } from './dtos/edit-cash-flow-entry.dto';
import { EditCashFlowEntry } from './edit-cash-flow-entry.service';

describe('EditCashFlowEntry - Unit tests', () => {
  let sut: EditCashFlowEntry;
  let dao: ICashFlowEntryDao;
  let findCompanyById: FindCompanyById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditCashFlowEntry,
        { provide: TOKENS.CashFlowEntryDao, useValue: createMock<ICashFlowEntryDao>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
      ],
    }).compile();

    sut = module.get(EditCashFlowEntry);
    dao = module.get(TOKENS.CashFlowEntryDao);
    findCompanyById = module.get(FindCompanyById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CashFlowEntryNotFoundError when the entry does not exist', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(1, { description: 'Novo' })).rejects.toThrow(CashFlowEntryNotFoundError);
    expect(dao.edit).not.toHaveBeenCalled();
  });

  it('should revalidate company when companyId is provided', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<CashFlowEntryDto>({ id: 1 }));
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ id: 2 }));
    const data: EditCashFlowEntryInputDto = { companyId: 2 };

    // Act
    await sut.execute(1, data);

    // Assert
    expect(findCompanyById.execute).toHaveBeenCalledWith(2, { onlyActive: true });
    expect(dao.edit).toHaveBeenCalledWith(1, { companyId: 2 });
  });

  it('should throw CompanyNotFoundError when the new company does not exist', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<CashFlowEntryDto>({ id: 1 }));
    jest.spyOn(findCompanyById, 'execute').mockRejectedValue(new CompanyNotFoundError());

    // Act & Assert
    await expect(sut.execute(1, { companyId: 99 })).rejects.toThrow(CompanyNotFoundError);
    expect(dao.edit).not.toHaveBeenCalled();
  });

  it('should convert occurredAt and not send origin', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<CashFlowEntryDto>({ id: 1 }));
    const data: EditCashFlowEntryInputDto = {
      type: CashFlowEntryType.DEBIT,
      amountInCents: 200,
      occurredAt: '2026-09-18T00:00:00.000Z',
      description: 'Ajuste',
    };

    // Act
    const result = await sut.execute(1, data);

    // Assert
    expect(dao.edit).toHaveBeenCalledWith(1, {
      type: CashFlowEntryType.DEBIT,
      amountInCents: 200,
      occurredAt: new Date('2026-09-18T00:00:00.000Z'),
      description: 'Ajuste',
    });
    expect(result).toEqual<SuccessMessage>({
      message: 'Lançamento de fluxo de caixa atualizado com sucesso',
    });
    expect(findCompanyById.execute).not.toHaveBeenCalled();
  });
});
