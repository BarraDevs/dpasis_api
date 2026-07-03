import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { BankNotFoundError } from 'src/app/global/bank/domain/errors/bank-not-found.error';
import { FindProviderById } from 'src/app/provider/provider/application/usecases/find-provider-by-id/find-provider-by-id.service';
import { ProviderNotFoundError } from 'src/app/provider/provider/domain/errors/provider-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ProviderItemScheduleType } from '../../../domain/enums/provider-item-schedule-type.enum';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';
import { CreateProviderItem } from './create-provider-item.service';

describe('CreateProviderItem - Unit tests', () => {
  let sut: CreateProviderItem;
  let repository: IProviderItemRepository;
  let findProviderById: FindProviderById;
  let findBankById: FindBankById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateProviderItem,
        {
          provide: TOKENS.ProviderItemRepository,
          useValue: createMock<IProviderItemRepository>(),
        },
        {
          provide: FindProviderById,
          useValue: createMock<FindProviderById>({ execute: jest.fn().mockResolvedValue({ id: 1 }) }),
        },
        {
          provide: FindBankById,
          useValue: createMock<FindBankById>({ execute: jest.fn().mockResolvedValue({ id: 2 }) }),
        },
      ],
    }).compile();

    sut = module.get(CreateProviderItem);
    repository = module.get(TOKENS.ProviderItemRepository);
    findProviderById = module.get(FindProviderById);
    findBankById = module.get(FindBankById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should save entity and return id', async() => {
    // Arrange
    jest.spyOn(repository, 'save').mockResolvedValue(99);

    // Act
    const result = await sut.execute({
      providerId: 1,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 2,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: 2,
    });

    // Assert
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 99 });
  });

  it('should propagate ProviderNotFoundError when provider does not exist', async() => {
    // Arrange
    jest.spyOn(findProviderById, 'execute').mockRejectedValue(new ProviderNotFoundError());
    const saveSpy = jest.spyOn(repository, 'save');

    // Act & Assert
    await expect(sut.execute({
      providerId: 999,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 2,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: 2,
    })).rejects.toThrow(ProviderNotFoundError);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should propagate BankNotFoundError when bank is inactive or missing', async() => {
    // Arrange
    jest.spyOn(findBankById, 'execute').mockRejectedValue(new BankNotFoundError());
    const saveSpy = jest.spyOn(repository, 'save');

    // Act & Assert
    await expect(sut.execute({
      providerId: 1,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 2,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: 999,
    })).rejects.toThrow(BankNotFoundError);
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
