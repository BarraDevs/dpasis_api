import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { TOKENS } from 'src/core/di/token';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { CreateCashFlowEntry } from './create-cash-flow-entry.service';
import { CreateCashFlowEntryInputDto, CreateCashFlowEntryOutputDto } from './dtos/create-cash-flow-entry.dto';

function makeValidCreateCashFlowEntryInput(
  overrides: Partial<CreateCashFlowEntryInputDto> = {},
): CreateCashFlowEntryInputDto {
  return {
    companyId: 1,
    type: CashFlowEntryType.CREDIT,
    amountInCents: 15050,
    occurredAt: '2026-09-17T12:00:00.000Z',
    description: 'Pagamento de boleto NFS-e 123',
    ...overrides,
  };
}

describe('CreateCashFlowEntry - Unit tests', () => {
  let sut: CreateCashFlowEntry;
  let dao: ICashFlowEntryDao;
  let findCompanyById: FindCompanyById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateCashFlowEntry,
        { provide: TOKENS.CashFlowEntryDao, useValue: createMock<ICashFlowEntryDao>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
      ],
    }).compile();

    sut = module.get(CreateCashFlowEntry);
    dao = module.get(TOKENS.CashFlowEntryDao);
    findCompanyById = module.get(FindCompanyById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CompanyNotFoundError when company does not exist', async() => {
    // Arrange
    const input = makeValidCreateCashFlowEntryInput();
    jest.spyOn(findCompanyById, 'execute').mockRejectedValue(new CompanyNotFoundError());

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(CompanyNotFoundError);
    expect(dao.save).not.toHaveBeenCalled();
  });

  it('should validate the company as active', async() => {
    // Arrange
    const input = makeValidCreateCashFlowEntryInput();
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ id: 1 }));
    jest.spyOn(dao, 'save').mockResolvedValue(10);

    // Act
    await sut.execute(input);

    // Assert
    expect(findCompanyById.execute).toHaveBeenCalledWith(1, { onlyActive: true });
  });

  it('should save a MANUAL entry and return id', async() => {
    // Arrange
    const input = makeValidCreateCashFlowEntryInput({ type: CashFlowEntryType.DEBIT });
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ id: 1 }));
    jest.spyOn(dao, 'save').mockResolvedValue(42);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(dao.save).toHaveBeenCalledWith({
      companyId: 1,
      type: CashFlowEntryType.DEBIT,
      origin: CashFlowEntryOrigin.MANUAL,
      amountInCents: 15050,
      occurredAt: new Date('2026-09-17T12:00:00.000Z'),
      description: 'Pagamento de boleto NFS-e 123',
    });
    expect(result).toEqual<CreateCashFlowEntryOutputDto>({ id: 42 });
  });
});
