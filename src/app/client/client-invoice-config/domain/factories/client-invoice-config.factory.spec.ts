import { AppException } from 'src/core/filters/app.exception';
import {
  ClientInvoiceConfigCreateProps,
  ClientInvoiceConfigProps,
} from '../entities/client-invoice-config.entity';
import { ClientInvoiceConfigDueDateType } from '../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';
import { InvalidDueDateDayError } from '../errors/invalid-due-date-day.error';
import { InvalidEmissionDayError } from '../errors/invalid-emission-day.error';
import { InvalidMonthsAnnualError } from '../errors/invalid-months-annual.error';
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

    it('should throw InvalidMonthsAnnualError when type is ANNUAL and months is empty', () => {
      const props = makeCreateProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [],
      });

      expect(() => ClientInvoiceConfigFactory.create(props)).toThrow(InvalidMonthsAnnualError);
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
  });

  describe('load', () => {
    it('should load a ClientInvoiceConfig from props', () => {
      const props = makeLoadProps({ id: 42 });

      const config = ClientInvoiceConfigFactory.load(props);

      expect(config.props.id).toBe(42);
      expect(config.props.clientId).toBe(10);
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
  });
});
