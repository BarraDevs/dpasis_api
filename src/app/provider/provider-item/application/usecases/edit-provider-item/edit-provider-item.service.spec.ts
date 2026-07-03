import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentsCountBelowPaidCountError } from 'src/app/provider/provider-item/domain/errors/provider-item-installments-count-below-paid-count.error';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { ProviderItemTotalValueLessThanPaidAmountError } from 'src/app/provider/provider-item/domain/errors/provider-item-total-value-less-than-paid-amount.error';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';
import { EditProviderItem } from './edit-provider-item.service';

function makeExistingItemWithPaidInstallments() {
  const created = ProviderItemFactory.create({
    providerId: 1,
    description: 'Serviço original',
    totalValueInCents: 40000,
    installmentsCount: 4,
    scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
    intervalDays: 30,
    dueDay: null,
    firstDueDate: new Date('2026-07-10'),
    bankId: 1,
  });

  const props = created.props;
  const paidInstallments = props.installments.slice(0, 2).map((installment, index) => ({
    ...installment,
    id: index + 1,
    status: ProviderItemInstallmentStatus.PAID,
  }));
  const pendingInstallments = props.installments.slice(2).map((installment, index) => ({
    ...installment,
    id: index + 3,
    status: ProviderItemInstallmentStatus.PENDING,
  }));

  return ProviderItemFactory.load({
    ...props,
    id: 10,
    installments: [...paidInstallments, ...pendingInstallments],
  });
}

describe('EditProviderItem - Unit tests', () => {
  let sut: EditProviderItem;
  let providerItemRepository: IProviderItemRepository;
  let findBankById: FindBankById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditProviderItem,
        {
          provide: TOKENS.ProviderItemRepository,
          useValue: createMock<IProviderItemRepository>(),
        },
        {
          provide: FindBankById,
          useValue: createMock<FindBankById>({ execute: jest.fn().mockResolvedValue({ id: 2 }) }),
        },
      ],
    }).compile();

    sut = module.get(EditProviderItem);
    providerItemRepository = module.get(TOKENS.ProviderItemRepository);
    findBankById = module.get(FindBankById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should edit description and return success message', async() => {
    // Arrange
    const existing = makeExistingItemWithPaidInstallments();
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(existing);
    const editSpy = jest.spyOn(providerItemRepository, 'edit');

    // Act
    const result = await sut.execute(10, { description: 'Nova descrição' });

    // Assert
    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual<SuccessMessage>({
      message: 'Item do prestador atualizado com sucesso',
    });
  });

  it('should not call repository.edit when body is empty', async() => {
    // Arrange
    const existing = makeExistingItemWithPaidInstallments();
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(existing);
    const editSpy = jest.spyOn(providerItemRepository, 'edit');

    // Act
    const result = await sut.execute(10, {});

    // Assert
    expect(editSpy).not.toHaveBeenCalled();
    expect(result).toEqual<SuccessMessage>({
      message: 'Item do prestador atualizado com sucesso',
    });
  });

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    // Arrange
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(10, { description: 'Teste' })).rejects.toThrow(ProviderItemNotFoundError);
  });

  it('should throw ProviderItemInstallmentsCountBelowPaidCountError when reducing installments below paid count', async() => {
    // Arrange
    const existing = makeExistingItemWithPaidInstallments();
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(existing);

    // Act & Assert
    await expect(sut.execute(10, { installmentsCount: 1 })).rejects.toThrow(
      ProviderItemInstallmentsCountBelowPaidCountError,
    );
  });

  it('should throw ProviderItemTotalValueLessThanPaidAmountError when total is below paid amount', async() => {
    // Arrange
    const existing = makeExistingItemWithPaidInstallments();
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(existing);

    // Act & Assert
    await expect(sut.execute(10, { totalValueInCents: 15000 })).rejects.toThrow(
      ProviderItemTotalValueLessThanPaidAmountError,
    );
  });

  it('should validate bank when bankId is provided', async() => {
    // Arrange
    const existing = makeExistingItemWithPaidInstallments();
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(existing);
    const findBankByIdSpy = jest.spyOn(findBankById, 'execute');

    // Act
    await sut.execute(10, { bankId: 2 });

    // Assert
    expect(findBankByIdSpy).toHaveBeenCalledWith(2, { onlyActive: true });
    expect(findBankByIdSpy).toHaveBeenCalledTimes(1);
  });
});
