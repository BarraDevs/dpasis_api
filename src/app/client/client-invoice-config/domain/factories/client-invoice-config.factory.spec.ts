import { AppException } from 'src/core/filters/app.exception';
import { InvalidBillingMonthsError } from 'src/shared/value-objects/billing-months/billing-months.error';
import {
  ClientInvoiceConfigCreateProps,
  ClientInvoiceConfigProps,
} from '../entities/client-invoice-config.entity';
import { ClientInvoiceConfigDueDateType } from '../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';
import {
  DueDateIsLessThanEmissionDayError,
  DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError,
} from '../value-objects/invoice-due-date/invoice-due-date.error';
import { ClientInvoiceConfigFactory } from './client-invoice-config.factory';

function makeValidCreateProps(overrides: Partial<ClientInvoiceConfigCreateProps> = {}): ClientInvoiceConfigCreateProps {
  return {
    clientId: 1,
    generateNf: true,
    type: ClientInvoiceConfigType.MONTHLY,
    emissionDay: 1,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 16,
    dueMonth: 6,
    deadlineDays: null,
    months: [],
    billingAddressId: 2,
    bankId: 3,
    autoProtestBoleto: false,
    issWithheld: false,
    message: null,
    ...overrides,
  };
}

function makeValidProps(overrides: Partial<ClientInvoiceConfigProps> = {}): ClientInvoiceConfigProps {
  return {
    ...makeValidCreateProps(),
    id: 100,
    ...overrides,
  };
}

describe('ClientInvoiceConfigFactory - Unit tests', () => {
  let sut: typeof ClientInvoiceConfigFactory;

  beforeEach(() => {
    sut = ClientInvoiceConfigFactory;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should instantiate entity with id null and normalized props for DUE_DATE', () => {
      // Arrange
      const props = makeValidCreateProps({
        clientId: 10,
        emissionDay: 1,
        dueDateDay: 20,
        dueMonth: 12,
      });

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props).toEqual({
        id: null,
        clientId: 10,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        dueMonth: 12,
        deadlineDays: null,
        months: [],
        billingAddressId: 2,
        bankId: 3,
        autoProtestBoleto: false,
        issWithheld: false,
        message: null,
      });
    });

    it('should instantiate entity with deadlineDays and null due date fields for DEADLINE', () => {
      // Arrange
      const props = makeValidCreateProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: 99,
        dueMonth: 8,
        deadlineDays: 7,
        emissionDay: 5,
      });

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props).toMatchObject({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        emissionDay: 5,
        dueDateDay: null,
        dueMonth: null,
        deadlineDays: 7,
      });
    });

    it('should instantiate entity with due date fields and null deadlineDays for DUE_DATE', () => {
      // Arrange
      const props = makeValidCreateProps({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 28,
        dueMonth: 8,
        deadlineDays: 7,
        emissionDay: 5,
      });

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props).toMatchObject({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        emissionDay: 5,
        dueDateDay: 28,
        dueMonth: 8,
        deadlineDays: null,
      });
    });

    it('should normalize months for ANNUAL type', () => {
      // Arrange
      const props = makeValidCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [12, 3, 3, 1],
      });

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props.months).toEqual([1, 3, 12]);
    });

    it('should coerce blank message to null via OptionalString', () => {
      // Arrange
      const props = makeValidCreateProps({ message: '   ' });

      // Act
      const entity = sut.create(props);

      // Assert
      expect(entity.props.message).toBeNull();
    });

    it('should throw DueDateIsLessThanEmissionDayError when due date day is not after emission day', () => {
      // Arrange
      const props = makeValidCreateProps({
        emissionDay: 10,
        dueDateDay: 9,
        dueMonth: 6,
      });

      // Act
      const act = () => sut.create(props);

      // Assert
      expect(act).toThrow(DueDateIsLessThanEmissionDayError);
    });

    it('should throw DueDateIsLessThanEmissionDayError when due date day the same as emission day', () => {
      // Arrange
      const props = makeValidCreateProps({
        emissionDay: 10,
        dueDateDay: 10,
        dueMonth: 6,
      });

      // Act
      const act = () => sut.create(props);

      // Assert
      expect(act).toThrow(DueDateIsLessThanEmissionDayError);
    });

    it('should throw DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError when interval is below 15 days', () => {
      // Arrange
      const props = makeValidCreateProps({
        emissionDay: 1,
        dueDateDay: 14,
        dueMonth: 6,
      });

      // Act
      const act = () => sut.create(props);

      // Assert
      expect(act).toThrow(DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError);
    });

    it('should throw DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError when interval is exactly 15 days', () => {
      // Arrange
      const props = makeValidCreateProps({
        emissionDay: 1,
        dueDateDay: 15,
        dueMonth: 6,
      });

      // Act
      const act = () => sut.create(props);

      // Assert
      expect(act).toThrow(DueDateIsLessThanMinimumIntervalBetweenEmissionDayAndDueDateDayError);
    });

    it('should throw InvalidBillingMonthsError when ANNUAL has empty months', () => {
      // Arrange
      const props = makeValidCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [],
      });

      // Act
      const act = () => sut.create(props);

      // Assert
      expect(act).toThrow(InvalidBillingMonthsError);
    });

    it('should throw AppException when dueDateType is invalid', () => {
      // Arrange
      const props = makeValidCreateProps({
        dueDateType: 'tipo-desconhecido' as ClientInvoiceConfigDueDateType,
      });

      // Act
      const act = () => sut.create(props);

      // Assert
      expect(act).toThrow(AppException);
    });
  });

  describe('edit', () => {
    it('should preserve id and apply same validation as create', () => {
      // Arrange
      const props = makeValidProps({
        id: 42,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        dueMonth: null,
        deadlineDays: 3,
        emissionDay: 2,
      });

      // Act
      const entity = sut.edit(props);

      // Assert
      expect(entity.props.id).toBe(42);
      expect(entity.props.deadlineDays).toBe(3);
      expect(entity.props.dueDateDay).toBeNull();
      expect(entity.props.dueMonth).toBeNull();
    });
  });

  describe('load', () => {
    it('should hydrate entity without re-validating invoice due date branch', () => {
      // Arrange
      const props = makeValidProps({
        id: 7,
        emissionDay: 1,
        dueDateDay: 5,
        dueMonth: 6,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      });

      // Act
      const entity = sut.load(props);

      // Assert
      expect(entity.props).toEqual(props);
    });

    it('should default months to empty array when months is undefined', () => {
      // Arrange
      const props = {
        ...makeValidProps({ id: 50, months: [] }),
        months: undefined,
      } as unknown as ClientInvoiceConfigProps;

      // Act
      const entity = sut.load(props);

      // Assert
      expect(entity.props.months).toEqual([]);
      expect(entity.props.id).toBe(50);
    });
  });
});
