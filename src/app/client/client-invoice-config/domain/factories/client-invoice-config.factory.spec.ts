import { AppException } from 'src/core/filters/app.exception';
import { InvalidBillingMonthsError } from 'src/shared/value-objects/billing-months/billing-months.error';
import { InvalidDueDateDayError } from 'src/shared/value-objects/due-date-day/due-date-day.error';
import { InvalidEmissionDayError } from 'src/shared/value-objects/emission-day/emission-day.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import {
  ClientInvoiceConfigCreateProps,
  ClientInvoiceConfigProps,
} from '../entities/client-invoice-config.entity';
import { ClientInvoiceConfigDueDateType } from '../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigFactory } from './client-invoice-config.factory';

function makeCreateProps(overrides?: Partial<ClientInvoiceConfigCreateProps>): ClientInvoiceConfigCreateProps {
  return {
    clientId: 10,
    generateNf: true,
    type: ClientInvoiceConfigType.MONTHLY,
    emissionDay: 5,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    deadlineDays: null,
    months: [],
    billingAddressId: 1,
    bankId: 1,
    autoProtestBoleto: false,
    message: null,
    ...overrides,
  };
}

function makeLoadProps(overrides?: Partial<ClientInvoiceConfigProps>): ClientInvoiceConfigProps {
  return {
    id: 1,
    clientId: 10,
    generateNf: true,
    type: ClientInvoiceConfigType.MONTHLY,
    emissionDay: 5,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    deadlineDays: null,
    months: [],
    billingAddressId: 1,
    bankId: 1,
    autoProtestBoleto: false,
    message: null,
    ...overrides,
  };
}

describe('ClientInvoiceConfigFactory', () => {
  describe('create', () => {
    it('should create a ClientInvoiceConfig with id null', () => {
      const props = makeCreateProps();

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config).toBeDefined();
      expect(config.props.id).toBeNull();
    });

    it('should create with MONTHLY type and DUE_DATE', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
      });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.type).toBe(ClientInvoiceConfigType.MONTHLY);
      expect(config.props.dueDateDay).toBe(20);
      expect(config.props.deadlineDays).toBeNull();
      expect(config.props.months).toEqual([]);
    });

    it('should create with ANNUAL type and months', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [1, 5, 9],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 10,
      });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.type).toBe(ClientInvoiceConfigType.ANNUAL);
      expect(config.props.months).toEqual([1, 5, 9]);
      expect(config.props.deadlineDays).toBe(10);
      expect(config.props.dueDateDay).toBeNull();
    });

    it('should throw InvalidEmissionDayError when emissionDay is invalid', () => {
      const props = makeCreateProps({ emissionDay: 0 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidEmissionDayError);
    });

    it('should throw InvalidEmissionDayError when emissionDay is 32', () => {
      const props = makeCreateProps({ emissionDay: 32 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidEmissionDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is less than or equal to emissionDay', () => {
      const props = makeCreateProps({
        emissionDay: 15,
        dueDateDay: 10,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay equals emissionDay', () => {
      const props = makeCreateProps({
        emissionDay: 15,
        dueDateDay: 15,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidBillingMonthsError when type is ANNUAL and months is empty', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [],
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw when type is DEADLINE and deadlineDays is not provided', () => {
      const props = makeCreateProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: null,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow();
    });

    it('should throw AppException when type is invalid', () => {
      const props = makeCreateProps({ type: 'INVALID' as ClientInvoiceConfigType });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(AppException);
    });

    it('should throw InvalidEmissionDayError when emissionDay is negative', () => {
      const props = makeCreateProps({ emissionDay: -1 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidEmissionDayError);
    });

    it('should throw InvalidEmissionDayError when emissionDay is decimal', () => {
      const props = makeCreateProps({ emissionDay: 5.5 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidEmissionDayError);
    });

    it('should throw InvalidEmissionDayError when emissionDay is NaN', () => {
      const props = makeCreateProps({ emissionDay: NaN });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidEmissionDayError);
    });

    it('should accept emissionDay 1 as valid boundary', () => {
      const props = makeCreateProps({ emissionDay: 1, dueDateDay: 2 });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.emissionDay).toBe(1);
    });

    it('should accept emissionDay 31 as valid boundary with DEADLINE type', () => {
      const props = makeCreateProps({
        emissionDay: 31,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 5,
      });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.emissionDay).toBe(31);
    });

    it('should throw InvalidDueDateDayError when emissionDay is 31 and dueDateDay is 31', () => {
      const props = makeCreateProps({ emissionDay: 31, dueDateDay: 31 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidDueDateDayError);
    });

    it('should accept dueDateDay 31 when emissionDay is 30', () => {
      const props = makeCreateProps({ emissionDay: 30, dueDateDay: 31 });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.emissionDay).toBe(30);
      expect(config.props.dueDateDay).toBe(31);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is 0', () => {
      const props = makeCreateProps({ emissionDay: 1, dueDateDay: 0 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is 32', () => {
      const props = makeCreateProps({ emissionDay: 1, dueDateDay: 32 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateDay is decimal', () => {
      const props = makeCreateProps({ emissionDay: 1, dueDateDay: 15.5 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidDueDateDayError when dueDateType is DUE_DATE and dueDateDay is null', () => {
      const props = makeCreateProps({
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: null,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidBillingMonthsError when type is ANNUAL and months contains 0', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [1, 0, 5],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        deadlineDays: 10,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw InvalidBillingMonthsError when type is ANNUAL and months contains 13', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [1, 13, 5],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        deadlineDays: 10,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw InvalidBillingMonthsError when type is ANNUAL and months contains negative', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [1, -1, 5],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        deadlineDays: 10,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw InvalidBillingMonthsError when type is ANNUAL and months contains decimal', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [1, 5.5, 9],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        deadlineDays: 10,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidBillingMonthsError);
    });

    it('should deduplicate and sort months when type is ANNUAL', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [9, 5, 1, 5, 9],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        deadlineDays: 10,
      });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.months).toEqual([1, 5, 9]);
    });

    it('should throw NumberMustBePositiveAndInt when deadlineDays is 0', () => {
      const props = makeCreateProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 0,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw NumberMustBePositiveAndInt when deadlineDays is negative', () => {
      const props = makeCreateProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: -1,
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw NumberMustBePositiveAndInt when clientId is 0', () => {
      const props = makeCreateProps({ clientId: 0 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw NumberMustBePositiveAndInt when clientId is negative', () => {
      const props = makeCreateProps({ clientId: -1 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw NumberMustBePositiveAndInt when billingAddressId is 0', () => {
      const props = makeCreateProps({ billingAddressId: 0 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw NumberMustBePositiveAndInt when bankId is 0', () => {
      const props = makeCreateProps({ bankId: 0 });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw AppException when generateNf is not boolean', () => {
      const props = makeCreateProps({ generateNf: 'true' as unknown as boolean });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(AppException);
    });

    it('should throw AppException when autoProtestBoleto is not boolean', () => {
      const props = makeCreateProps({ autoProtestBoleto: 1 as unknown as boolean });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(AppException);
    });

    it('should throw AppException when dueDateType is invalid', () => {
      const props = makeCreateProps({ dueDateType: 'INVALID' as ClientInvoiceConfigDueDateType });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(AppException);
    });

    it('should create with message as valid string', () => {
      const props = makeCreateProps({ message: 'Mensagem de teste' });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.message).toBe('Mensagem de teste');
    });

    it('should create with message null when empty string', () => {
      const props = makeCreateProps({ message: '' });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.message).toBeNull();
    });

    it('should create with message null when undefined', () => {
      const props = makeCreateProps({ message: undefined });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.message).toBeNull();
    });

    it('should create MONTHLY with empty months', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.MONTHLY,
        months: [],
      });

      const config = ClientInvoiceConfigFactory.create(props);

      expect(config.props.months).toEqual([]);
    });
  });

  describe('load', () => {
    it('should load a ClientInvoiceConfig from props', () => {
      const props = makeLoadProps({ id: 42 });

      const config = ClientInvoiceConfigFactory.load(props);

      expect(config.props.id).toBe(42);
      expect(config.props.clientId).toBe(10);
    });

    it('should load and preserve all props without validation', () => {
      const props = makeLoadProps({
        id: 99,
        clientId: 100,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 15,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 7,
        months: [3, 6, 9, 12],
        billingAddressId: 2,
        bankId: 3,
        autoProtestBoleto: true,
        message: 'Loaded message',
      });

      const config = ClientInvoiceConfigFactory.load(props);

      expect(config.props).toEqual(props);
    });

    it('should load with id null', () => {
      const props = makeLoadProps({ id: null });

      const config = ClientInvoiceConfigFactory.load(props);

      expect(config.props.id).toBeNull();
    });

    it('should load with months undefined and default to empty array', () => {
      const props = makeLoadProps({ months: undefined } as Partial<ClientInvoiceConfigProps>);

      const config = ClientInvoiceConfigFactory.load(props);

      expect(config.props.months).toEqual([]);
    });
  });

  describe('edit', () => {
    it('should edit a ClientInvoiceConfig', () => {
      const props = makeLoadProps({
        id: 1,
        emissionDay: 5,
        dueDateDay: 15,
      });

      const config = ClientInvoiceConfigFactory.edit(props);

      expect(config.props.id).toBe(1);
      expect(config.props.emissionDay).toBe(5);
      expect(config.props.dueDateDay).toBe(15);
    });

    it('should throw InvalidEmissionDayError when edit has invalid emissionDay', () => {
      const props = makeLoadProps({ id: 1, emissionDay: 0 });

      expect(() => ClientInvoiceConfigFactory.edit(props)).toThrow(InvalidEmissionDayError);
    });

    it('should throw InvalidDueDateDayError when edit has dueDateDay less than emissionDay', () => {
      const props = makeLoadProps({
        id: 1,
        emissionDay: 20,
        dueDateDay: 10,
      });

      expect(() => ClientInvoiceConfigFactory.edit(props)).toThrow(InvalidDueDateDayError);
    });

    it('should throw InvalidBillingMonthsError when edit has ANNUAL type with invalid months', () => {
      const props = makeLoadProps({
        id: 1,
        type: ClientInvoiceConfigType.ANNUAL,
        months: [],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 10,
      });

      expect(() => ClientInvoiceConfigFactory.edit(props)).toThrow(InvalidBillingMonthsError);
    });

    it('should throw when edit has DEADLINE type without deadlineDays', () => {
      const props = makeLoadProps({
        id: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: null,
      });

      expect(() => ClientInvoiceConfigFactory.edit(props)).toThrow();
    });

    it('should throw InvalidDueDateDayError when edit has DUE_DATE type without dueDateDay', () => {
      const props = makeLoadProps({
        id: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: null,
      });

      expect(() => ClientInvoiceConfigFactory.edit(props)).toThrow(InvalidDueDateDayError);
    });

    it('should edit and apply same validations as create', () => {
      const props = makeLoadProps({
        id: 1,
        type: ClientInvoiceConfigType.ANNUAL,
        months: [6, 12, 3],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 15,
      });

      const config = ClientInvoiceConfigFactory.edit(props);

      expect(config.props.id).toBe(1);
      expect(config.props.months).toEqual([3, 6, 12]);
      expect(config.props.deadlineDays).toBe(15);
    });
  });
});
