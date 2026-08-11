import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProviderItem } from 'src/app/provider/provider-item/domain/entities/provider-item.entity';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentAlreadyPaidError } from 'src/app/provider/provider-item/domain/errors/provider-item-installment-already-paid.error';
import { ProviderItemInstallmentNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-installment-not-found.error';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';
import { PayProviderItemInstallment } from './pay-provider-item-installment.service';

function makeLoadedItem(overrides?: {
  installmentId?: number;
  status?: ProviderItemInstallmentStatus;
}): ProviderItem {
  const installmentId = overrides?.installmentId ?? 5;
  const status = overrides?.status ?? ProviderItemInstallmentStatus.PENDING;

  return ProviderItemFactory.load({
    id: 1,
    providerId: 1,
    description: 'Serviço',
    totalValueInCents: 10000,
    installmentsCount: 1,
    scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
    intervalDays: 30,
    dueDay: null,
    firstDueDate: new Date('2026-07-10'),
    bankId: 1,
    active: true,
    installments: [
      {
        id: installmentId,
        number: 1,
        valueInCents: 10000,
        dueDate: new Date('2026-07-10'),
        status,
      },
    ],
  });
}

describe('PayProviderItemInstallment - Unit tests', () => {
  let sut: PayProviderItemInstallment;
  let providerItemRepository: IProviderItemRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        PayProviderItemInstallment,
        {
          provide: TOKENS.ProviderItemRepository,
          useValue: createMock<IProviderItemRepository>(),
        },
      ],
    }).compile();

    sut = module.get(PayProviderItemInstallment);
    providerItemRepository = module.get(TOKENS.ProviderItemRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should mark installment as paid and call repository.edit', async() => {
    // Arrange
    const item = makeLoadedItem({ installmentId: 5 });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);
    const editSpy = jest.spyOn(providerItemRepository, 'edit');

    // Act
    const result = await sut.execute(1, 5);

    // Assert
    expect(item.props.installments[0].status).toBe(ProviderItemInstallmentStatus.PAID);
    expect(editSpy).toHaveBeenCalledWith(item);
    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual<SuccessMessage>({
      message: 'Parcela marcada como paga com sucesso',
    });
  });

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    // Arrange
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(null);
    const editSpy = jest.spyOn(providerItemRepository, 'edit');

    // Act & Assert
    await expect(sut.execute(1, 5)).rejects.toThrow(ProviderItemNotFoundError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should throw ProviderItemInstallmentNotFoundError when installment does not exist', async() => {
    // Arrange
    const item = makeLoadedItem({ installmentId: 5 });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);
    const editSpy = jest.spyOn(providerItemRepository, 'edit');

    // Act & Assert
    await expect(sut.execute(1, 999)).rejects.toThrow(ProviderItemInstallmentNotFoundError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should throw ProviderItemInstallmentAlreadyPaidError when installment is already paid', async() => {
    // Arrange
    const item = makeLoadedItem({
      installmentId: 5,
      status: ProviderItemInstallmentStatus.PAID,
    });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);
    const editSpy = jest.spyOn(providerItemRepository, 'edit');

    // Act & Assert
    await expect(sut.execute(1, 5)).rejects.toThrow(ProviderItemInstallmentAlreadyPaidError);
    expect(editSpy).not.toHaveBeenCalled();
  });
});
