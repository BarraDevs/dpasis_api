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
    dueMonth: 5,
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

    it('should create a ClientInvoiceConfig with full ANNUAL config', () => {
      const props = makeClientInvoiceConfigProps({
        type: ClientInvoiceConfigType.ANNUAL,
        months: [3, 6, 9, 12],
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 15,
        message: 'Pagamento até o vencimento',
      });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.type).toBe(ClientInvoiceConfigType.ANNUAL);
      expect(config.props.months).toEqual([3, 6, 9, 12]);
      expect(config.props.deadlineDays).toBe(15);
      expect(config.props.message).toBe('Pagamento até o vencimento');
    });

    it('should create a ClientInvoiceConfig with empty months for MONTHLY type', () => {
      const props = makeClientInvoiceConfigProps({
        type: ClientInvoiceConfigType.MONTHLY,
        months: [],
      });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.months).toEqual([]);
    });

    it('should create a ClientInvoiceConfig with dueDateDay null when DEADLINE', () => {
      const props = makeClientInvoiceConfigProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 7,
      });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.dueDateDay).toBeNull();
      expect(config.props.deadlineDays).toBe(7);
    });

    it('should create with emissionDay at boundary 31', () => {
      const props = makeClientInvoiceConfigProps({ emissionDay: 31 });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.emissionDay).toBe(31);
    });

    it('should create with single month', () => {
      const props = makeClientInvoiceConfigProps({ months: [6] });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.months).toEqual([6]);
    });

    it('should create with all 12 months', () => {
      const props = makeClientInvoiceConfigProps({
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.months).toHaveLength(12);
    });

    it('should create with message null', () => {
      const props = makeClientInvoiceConfigProps({ message: null });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.message).toBeNull();
    });

    it('should create with id 0', () => {
      const props = makeClientInvoiceConfigProps({ id: 0 });

      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.id).toBe(0);
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
      expect(config.props.deadlineDays).toBeNull();
      expect(config.props.months).toEqual([]);
      expect(config.props.billingAddressId).toBe(1);
      expect(config.props.bankId).toBe(1);
      expect(config.props.autoProtestBoleto).toBe(false);
      expect(config.props.message).toBeNull();
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeClientInvoiceConfigProps();
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props;
      (returnedProps as Record<string, unknown>).emissionDay = 99;

      expect(config.props.emissionDay).toBe(5);
    });

    it('should preserve immutability when mutating dueDateDay', () => {
      const props = makeClientInvoiceConfigProps({ dueDateDay: 20 });
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props;
      (returnedProps as Record<string, unknown>).dueDateDay = 99;

      expect(config.props.dueDateDay).toBe(20);
    });

    it('should preserve immutability when mutating clientId', () => {
      const props = makeClientInvoiceConfigProps({ clientId: 50 });
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props;
      (returnedProps as Record<string, unknown>).clientId = 999;

      expect(config.props.clientId).toBe(50);
    });

    it('should return props with message when provided', () => {
      const props = makeClientInvoiceConfigProps({ message: 'Mensagem de boleto' });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.message).toBe('Mensagem de boleto');
    });

    it('should return props with generateNf false', () => {
      const props = makeClientInvoiceConfigProps({ generateNf: false });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.generateNf).toBe(false);
    });

    it('should return props with autoProtestBoleto true', () => {
      const props = makeClientInvoiceConfigProps({ autoProtestBoleto: true });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.autoProtestBoleto).toBe(true);
    });

    it('should return props with all ids correctly', () => {
      const props = makeClientInvoiceConfigProps({
        id: 42,
        clientId: 100,
        billingAddressId: 5,
        bankId: 3,
      });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.id).toBe(42);
      expect(config.props.clientId).toBe(100);
      expect(config.props.billingAddressId).toBe(5);
      expect(config.props.bankId).toBe(3);
    });

    it('should return props with emissionDay and dueDateDay at boundaries', () => {
      const props = makeClientInvoiceConfigProps({
        emissionDay: 1,
        dueDateDay: 31,
      });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.emissionDay).toBe(1);
      expect(config.props.dueDateDay).toBe(31);
    });

    it('should return a new object on each props access', () => {
      const props = makeClientInvoiceConfigProps();
      const config = ClientInvoiceConfig._instantiate(props);

      const firstAccess = config.props;
      const secondAccess = config.props;

      expect(firstAccess).not.toBe(secondAccess);
      expect(firstAccess).toEqual(secondAccess);
    });

    it('should preserve immutability when mutating type', () => {
      const props = makeClientInvoiceConfigProps({ type: ClientInvoiceConfigType.ANNUAL });
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props as unknown as Record<string, unknown>;
      returnedProps.type = ClientInvoiceConfigType.MONTHLY;

      expect(config.props.type).toBe(ClientInvoiceConfigType.ANNUAL);
    });

    it('should preserve immutability when mutating dueDateType', () => {
      const props = makeClientInvoiceConfigProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        deadlineDays: 5,
      });
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props as unknown as Record<string, unknown>;
      returnedProps.dueDateType = ClientInvoiceConfigDueDateType.DUE_DATE;

      expect(config.props.dueDateType).toBe(ClientInvoiceConfigDueDateType.DEADLINE);
    });

    it('should preserve immutability when mutating billingAddressId', () => {
      const props = makeClientInvoiceConfigProps({ billingAddressId: 99 });
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props as unknown as Record<string, unknown>;
      returnedProps.billingAddressId = 999;

      expect(config.props.billingAddressId).toBe(99);
    });

    it('should preserve immutability when mutating bankId', () => {
      const props = makeClientInvoiceConfigProps({ bankId: 42 });
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props as unknown as Record<string, unknown>;
      returnedProps.bankId = 999;

      expect(config.props.bankId).toBe(42);
    });

    it('should preserve immutability when mutating deadlineDays', () => {
      const props = makeClientInvoiceConfigProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 15,
      });
      const config = ClientInvoiceConfig._instantiate(props);

      const returnedProps = config.props as unknown as Record<string, unknown>;
      returnedProps.deadlineDays = 999;

      expect(config.props.deadlineDays).toBe(15);
    });

    it('should return props with deadlineDays when DEADLINE type', () => {
      const props = makeClientInvoiceConfigProps({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 30,
      });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.deadlineDays).toBe(30);
      expect(config.props.dueDateDay).toBeNull();
    });

    it('should return props with months array', () => {
      const props = makeClientInvoiceConfigProps({ months: [3, 6, 9, 12] });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props.months).toEqual([3, 6, 9, 12]);
    });

    it('should return props matching input structure', () => {
      const props = makeClientInvoiceConfigProps({
        id: 100,
        clientId: 200,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 15,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 20,
        months: [1, 7],
        billingAddressId: 8,
        bankId: 9,
        autoProtestBoleto: true,
        message: 'Test',
      });
      const config = ClientInvoiceConfig._instantiate(props);

      expect(config.props).toMatchObject({
        id: 100,
        clientId: 200,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 15,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 20,
        months: [1, 7],
        billingAddressId: 8,
        bankId: 9,
        autoProtestBoleto: true,
        message: 'Test',
      });
    });
  });
});
