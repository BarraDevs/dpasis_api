import { AppException } from 'src/core/filters/app.exception';
import { InvalidDayError } from 'src/shared/value-objects/day/day.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { ProviderItemInstallmentStatus } from '../enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from '../enums/provider-item-schedule-type.enum';
import { ProviderItemCreateProps, ProviderItemProps } from '../entities/provider-item.entity';
import { ProviderItemTotalValueLessThanPaidAmountError } from '../errors/provider-item-total-value-less-than-paid-amount.error';
import { ProviderItemFactory } from './provider-item.factory';

function makeValidCreateProps(overrides: Partial<ProviderItemCreateProps> = {}): ProviderItemCreateProps {
  return {
    providerId: 1,
    description: 'Serviço de manutenção',
    totalValueInCents: 30000,
    installmentsCount: 3,
    scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
    intervalDays: 30,
    dueDay: null,
    firstDueDate: new Date('2026-07-10'),
    bankId: 1,
    ...overrides,
  };
}

function makeProviderItemProps(overrides: Partial<ProviderItemProps> = {}): ProviderItemProps {
  return {
    id: 10,
    providerId: 1,
    description: 'Serviço de manutenção',
    totalValueInCents: 30000,
    installmentsCount: 3,
    scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
    intervalDays: 30,
    dueDay: null,
    firstDueDate: new Date('2026-07-10'),
    bankId: 1,
    active: true,
    installments: [
      {
        id: 1,
        number: 1,
        valueInCents: 10000,
        dueDate: new Date('2026-07-10'),
        status: ProviderItemInstallmentStatus.PENDING,
      },
    ],
    ...overrides,
  };
}

describe('ProviderItemFactory - Unit tests', () => {
  let sut: typeof ProviderItemFactory;

  beforeEach(() => {
    sut = ProviderItemFactory;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should create entity with pending installments for INTERVAL_DAYS', () => {
      // Arrange
      const props = makeValidCreateProps();

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props.id).toBeNull();
      expect(entity.props.active).toBe(true);
      expect(entity.props.installments).toHaveLength(3);
      expect(entity.props.installments.every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
      expect(entity.props.intervalDays).toBe(30);
      expect(entity.props.dueDay).toBeNull();
    });

    it('should create entity for DUE_DAY schedule', () => {
      // Arrange
      const props = makeValidCreateProps({
        scheduleType: ProviderItemScheduleType.DUE_DAY,
        intervalDays: null,
        dueDay: 15,
      });

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props.scheduleType).toBe(ProviderItemScheduleType.DUE_DAY);
      expect(entity.props.dueDay).toBe(15);
      expect(entity.props.intervalDays).toBeNull();
    });

    it('should trim description whitespace', () => {
      // Arrange
      const props = makeValidCreateProps({ description: '  Serviço  ' });

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props.description).toBe('Serviço');
    });

    it('should throw for empty description', () => {
      // Arrange
      const props = makeValidCreateProps({ description: '   ' });

      // Act & Assert
      expect(() => sut.create(props)).toThrow(AppException);
    });

    it('should throw for providerId zero', () => {
      // Arrange
      const props = makeValidCreateProps({ providerId: 0 });

      // Act & Assert
      expect(() => sut.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw for INTERVAL_DAYS without intervalDays', () => {
      // Arrange
      const props = makeValidCreateProps({ intervalDays: null });

      // Act & Assert
      expect(() => sut.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw for DUE_DAY without dueDay', () => {
      // Arrange
      const props = makeValidCreateProps({
        scheduleType: ProviderItemScheduleType.DUE_DAY,
        intervalDays: null,
        dueDay: null,
      });

      // Act & Assert
      expect(() => sut.create(props)).toThrow(InvalidDayError);
    });

    it('should throw for unknown schedule type', () => {
      // Arrange
      const props = makeValidCreateProps({
        scheduleType: 'invalido' as ProviderItemScheduleType,
      });

      // Act & Assert
      expect(() => sut.create(props)).toThrow(AppException);
      expect(() => sut.create(props)).toThrow('O campo scheduleType não é válido');
    });
  });

  describe('edit', () => {
    it('should preserve paid installments passed in', () => {
      // Arrange
      const paidInstallments = [
        {
          id: 1,
          number: 1,
          valueInCents: 10000,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ];

      // Act
      const entity = sut.edit({
        ...makeValidCreateProps({ totalValueInCents: 30000, installmentsCount: 3 }),
        id: 10,
        active: true,
        paidInstallments,
      });

      // Assert
      expect(entity.props.id).toBe(10);
      expect(entity.props.installments[0].status).toBe(ProviderItemInstallmentStatus.PAID);
      expect(entity.props.installments.filter((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toHaveLength(2);
    });

    it('should preserve active false', () => {
      // Act
      const entity = sut.edit({
        ...makeValidCreateProps(),
        id: 10,
        active: false,
      });

      // Assert
      expect(entity.props.active).toBe(false);
    });

    it('should propagate ProviderItemTotalValueLessThanPaidAmountError from installment plan', () => {
      // Arrange
      const paidInstallments = [
        {
          id: 1,
          number: 1,
          valueInCents: 200,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ];

      // Act & Assert
      expect(() => sut.edit({
        ...makeValidCreateProps({ totalValueInCents: 150, installmentsCount: 3 }),
        id: 10,
        active: true,
        paidInstallments,
      })).toThrow(ProviderItemTotalValueLessThanPaidAmountError);
    });
  });

  describe('load', () => {
    it('should load entity without re-validation', () => {
      // Arrange
      const props = makeProviderItemProps({
        id: 42,
        active: false,
        description: 'Carregado do banco',
      });

      // Act
      const entity = sut.load(props);

      // Assert
      expect(entity.props.id).toBe(42);
      expect(entity.props.active).toBe(false);
      expect(entity.props.description).toBe('Carregado do banco');
    });

    it('should copy installments on load', () => {
      // Arrange
      const props = makeProviderItemProps();
      const entity = sut.load(props);

      // Act
      const returnedInstallments = entity.props.installments;
      returnedInstallments[0].valueInCents = 99999;

      // Assert
      expect(entity.props.installments[0].valueInCents).toBe(10000);
    });
  });
});
