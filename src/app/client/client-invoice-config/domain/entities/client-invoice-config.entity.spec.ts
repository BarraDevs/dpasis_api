import { ClientInvoiceConfigDueDateType } from '../enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../enums/client-invoice-config-type.enum';
import { ClientInvoiceConfig, ClientInvoiceConfigProps } from './client-invoice-config.entity';

function makeClientInvoiceConfigProps(overrides?: Partial<ClientInvoiceConfigProps>): ClientInvoiceConfigProps {
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

describe('ClientInvoiceConfig Entity', () => {
  describe('_instantiate', () => {
    it('should create a ClientInvoiceConfig instance with the provided props', () => {
      const props = makeClientInvoiceConfigProps();

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config).toBeInstanceOf(ClientInvoiceConfig);
    });

    it('should create a ClientInvoiceConfig with null id', () => {
      const props = makeClientInvoiceConfigProps({ id: null });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.id).toBeNull();
    });

    it('should create a ClientInvoiceConfig with ANNUAL type and months', () => {
      const props = makeClientInvoiceConfigProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [1, 5, 9],
      });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.type).toBe(ClientInvoiceConfigType.ANNUAL);
      expect(config.props.months).toEqual([1, 5, 9]);
    });

    it('should create a ClientInvoiceConfig with DEADLINE due date type', () => {
      const props = makeClientInvoiceConfigProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 10,
      });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.dueDateType).toBe(ClientInvoiceConfigDueDateType.DEADLINE);
      expect(config.props.deadlineDays).toBe(10);
      expect(config.props.dueDateDay).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeClientInvoiceConfigProps();

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props).toBeDefined();
      expect(config.props.id).toBe(1);
      expect(config.props.clientId).toBe(10);
      expect(config.props.generateNf).toBe(true);
      expect(config.props.type).toBe(ClientInvoiceConfigType.MONTHLY);
      expect(config.props.emissionDay).toBe(5);
      expect(config.props.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
      expect(config.props.dueDateDay).toBe(15);
      expect(config.props.billingAddressId).toBe(1);
      expect(config.props.bankId).toBe(1);
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeClientInvoiceConfigProps();
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props;
      (returnedProps as Record<string, unknown>).emissionDay = 99;

      expect(config.props.emissionDay).toBe(5);
    });
  });
});
