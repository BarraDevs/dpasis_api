import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemInstallmentAlreadyPaidError } from 'src/app/provider/provider-item/domain/errors/provider-item-installment-already-paid.error';
import { ProviderItemInstallmentNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-installment-not-found.error';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';
import { PayProviderItemInstallment } from './pay-provider-item-installment.service';

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

  it('should mark installment as paid and return success message', async() => {
    // Arrange
    const item = ProviderItemFactory.create({
      providerId: 1,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      bankId: 1,
    });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);
    jest.spyOn(providerItemRepository, 'findInstallmentById').mockResolvedValue({
      id: 5,
      status: ProviderItemInstallmentStatus.PENDING,
    });
    const payInstallmentSpy = jest.spyOn(providerItemRepository, 'payInstallment');

    // Act
    const result = await sut.execute(1, 5);

    // Assert
    expect(payInstallmentSpy).toHaveBeenCalledWith(1, 5);
    expect(payInstallmentSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual<SuccessMessage>({
      message: 'Parcela marcada como paga com sucesso',
    });
  });

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    // Arrange
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(null);
    const payInstallmentSpy = jest.spyOn(providerItemRepository, 'payInstallment');

    // Act & Assert
    await expect(sut.execute(1, 5)).rejects.toThrow(ProviderItemNotFoundError);
    expect(payInstallmentSpy).not.toHaveBeenCalled();
  });

  it('should throw ProviderItemInstallmentNotFoundError when installment does not exist', async() => {
    // Arrange
    const item = ProviderItemFactory.create({
      providerId: 1,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      bankId: 1,
    });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);
    jest.spyOn(providerItemRepository, 'findInstallmentById').mockResolvedValue(null);
    const payInstallmentSpy = jest.spyOn(providerItemRepository, 'payInstallment');

    // Act & Assert
    await expect(sut.execute(1, 5)).rejects.toThrow(ProviderItemInstallmentNotFoundError);
    expect(payInstallmentSpy).not.toHaveBeenCalled();
  });

  it('should throw ProviderItemInstallmentAlreadyPaidError when installment is already paid', async() => {
    // Arrange
    const item = ProviderItemFactory.create({
      providerId: 1,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      bankId: 1,
    });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);
    jest.spyOn(providerItemRepository, 'findInstallmentById').mockResolvedValue({
      id: 5,
      status: ProviderItemInstallmentStatus.PAID,
    });
    const payInstallmentSpy = jest.spyOn(providerItemRepository, 'payInstallment');

    // Act & Assert
    await expect(sut.execute(1, 5)).rejects.toThrow(ProviderItemInstallmentAlreadyPaidError);
    expect(payInstallmentSpy).not.toHaveBeenCalled();
  });
});
