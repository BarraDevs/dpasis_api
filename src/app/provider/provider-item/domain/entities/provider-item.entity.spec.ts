import { ProviderItemInstallmentStatus } from '../enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from '../enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentAlreadyPaidError } from '../errors/provider-item-installment-already-paid.error';
import { ProviderItemInstallmentNotFoundError } from '../errors/provider-item-installment-not-found.error';
import { ProviderItem, ProviderItemProps } from './provider-item.entity';

function makeProviderItemProps(overrides?: Partial<ProviderItemProps>): ProviderItemProps {
  return {
    id: 1,
    providerId: 10,
    description: 'Serviço de manutenção',
    totalValueInCents: 30000,
    installmentsCount: 3,
    scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
    intervalDays: 30,
    dueDay: null,
    firstDueDate: new Date('2026-07-10'),
    bankId: 5,
    active: true,
    installments: [
      {
        id: 1,
        number: 1,
        valueInCents: 30000,
        dueDate: new Date('2026-07-10'),
        status: ProviderItemInstallmentStatus.PENDING,
      },
    ],
    ...overrides,
  };
}

describe('ProviderItem', () => {
  describe('_instantiate', () => {
    it('should create a ProviderItem instance with the provided props', () => {
      // Arrange
      const props = makeProviderItemProps();

      // Act
      const providerItem = ProviderItem._instantiate(props);

      // Assert
      expect(providerItem).toBeInstanceOf(ProviderItem);
    });

    it('should create a ProviderItem with null id (before persistence)', () => {
      // Arrange
      const props = makeProviderItemProps({ id: null });

      // Act
      const providerItem = ProviderItem._instantiate(props);

      // Assert
      expect(providerItem.props.id).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      // Arrange
      const props = makeProviderItemProps({
        id: 42,
        providerId: 20,
        description: 'Descrição',
        totalValueInCents: 50000,
        installmentsCount: 2,
        bankId: 8,
        active: false,
      });

      // Act
      const providerItem = ProviderItem._instantiate(props);

      // Assert
      expect(providerItem.props).toEqual<ProviderItemProps>({
        id: 42,
        providerId: 20,
        description: 'Descrição',
        totalValueInCents: 50000,
        installmentsCount: 2,
        scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
        intervalDays: 30,
        dueDay: null,
        firstDueDate: props.firstDueDate,
        bankId: 8,
        active: false,
        installments: props.installments,
      });
    });

    it('should return a copy of props (immutability)', () => {
      // Arrange
      const props = makeProviderItemProps();
      const providerItem = ProviderItem._instantiate(props);

      // Act
      const returnedProps = providerItem.props;
      (returnedProps as Record<string, unknown>).description = 'Modified';

      // Assert
      expect(providerItem.props.description).toBe('Serviço de manutenção');
    });

    it('should return a copy of installments (immutability)', () => {
      // Arrange
      const props = makeProviderItemProps();
      const providerItem = ProviderItem._instantiate(props);

      // Act
      const returnedInstallments = providerItem.props.installments;
      returnedInstallments[0].valueInCents = 99999;

      // Assert
      expect(providerItem.props.installments[0].valueInCents).toBe(30000);
    });
  });

  describe('isActive', () => {
    it('should return true when active is true', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps({ active: true }));

      // Act & Assert
      expect(providerItem.isActive()).toBe(true);
    });

    it('should return false when active is false', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps({ active: false }));

      // Act & Assert
      expect(providerItem.isActive()).toBe(false);
    });
  });

  describe('activate', () => {
    it('should set active to true', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps({ active: false }));

      // Act
      providerItem.activate();

      // Assert
      expect(providerItem.props.active).toBe(true);
    });

    it('should keep active as true when it is already true', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps({ active: true }));

      // Act
      providerItem.activate();

      // Assert
      expect(providerItem.props.active).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should set active to false', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps({ active: true }));

      // Act
      providerItem.deactivate();

      // Assert
      expect(providerItem.props.active).toBe(false);
    });

    it('should keep active as false when it is already false', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps({ active: false }));

      // Act
      providerItem.deactivate();

      // Assert
      expect(providerItem.props.active).toBe(false);
    });
  });

  describe('payInstallment', () => {
    it('should mark installment as paid', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps());

      // Act
      providerItem.payInstallment(1);

      // Assert
      expect(providerItem.props.installments[0].status).toBe(ProviderItemInstallmentStatus.PAID);
    });

    it('should throw ProviderItemInstallmentNotFoundError when installment does not exist', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps());

      // Act & Assert
      expect(() => providerItem.payInstallment(999)).toThrow(ProviderItemInstallmentNotFoundError);
    });

    it('should throw ProviderItemInstallmentAlreadyPaidError when installment is already paid', () => {
      // Arrange
      const providerItem = ProviderItem._instantiate(makeProviderItemProps({
        installments: [
          {
            id: 1,
            number: 1,
            valueInCents: 30000,
            dueDate: new Date('2026-07-10'),
            status: ProviderItemInstallmentStatus.PAID,
          },
        ],
      }));

      // Act & Assert
      expect(() => providerItem.payInstallment(1)).toThrow(ProviderItemInstallmentAlreadyPaidError);
    });
  });
});
