import { ClientInvoiceType } from '../enums/client-invoice-type.enum';
import { ClientType } from '../enums/client-type.enum';
import { Client, ClientProps } from './client.entity';

function makeClientProps(overrides?: Partial<ClientProps>): ClientProps {
  return {
    id: 1,
    active: true,
    type: ClientType.PJ,
    document: '12345678000199',
    ie: '123456789',
    groupId: 10,
    resaleId: 20,
    parentClientId: null,
    isSubClient: false,
    companyIds: [1],
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    companyName: 'Empresa LTDA',
    fantasyName: 'Empresa',
    socialName: null,
    domain: null,
    headquarters: 'São Paulo',
    ...overrides,
  };
}

describe('Client', () => {
  describe('_instantiate', () => {
    it('should create a Client instance with the provided props', () => {
      const props = makeClientProps();

      const client = Client._instantiate(props);

      expect(client).toBeInstanceOf(Client);
    });

    it('should create a Client with PF type', () => {
      const props = makeClientProps({ type: ClientType.PF });

      const client = Client._instantiate(props);

      expect(client.props.type).toBe(ClientType.PF);
    });

    it('should create a Client with null ie when not provided', () => {
      const props = makeClientProps({ ie: null });

      const client = Client._instantiate(props);

      expect(client.props.ie).toBeNull();
    });

    it('should create a Client with null id (before persistence)', () => {
      const props = makeClientProps({ id: null as unknown as number });

      const client = Client._instantiate(props);

      expect(client.props.id).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeClientProps({
        id: 42,
        active: false,
        companyName: 'Custom Company',
      });

      const client = Client._instantiate(props);

      expect(client.props.id).toBe(42);
      expect(client.props.active).toBe(false);
      expect(client.props.type).toBe(ClientType.PJ);
      expect(client.props.document).toBe('12345678000199');
      expect(client.props.ie).toBe('123456789');
      expect(client.props.groupId).toBe(10);
      expect(client.props.resaleId).toBe(20);
      expect(client.props.companyIds).toEqual([1]);
      expect(client.props.invoiceType).toBe(ClientInvoiceType.CONTRACT);
      expect(client.props.generateInvoice).toBe(true);
      expect(client.props.companyName).toBe('Custom Company');
      expect(client.props.fantasyName).toBe('Empresa');
      expect(client.props.socialName).toBeNull();
      expect(client.props.domain).toBeNull();
      expect(client.props.headquarters).toBe('São Paulo');
    });

    it('should expose domain when set', () => {
      const client = Client._instantiate(
        makeClientProps({ domain: 'tenant.app.dev' }),
      );

      expect(client.props.domain).toBe('tenant.app.dev');
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeClientProps();
      const client = Client._instantiate(props);

      const returnedProps = client.props;
      (returnedProps as Record<string, unknown>).companyName = 'Modified Name';

      expect(client.props.companyName).toBe('Empresa LTDA');
    });

    it('should return all expected props', () => {
      const props = makeClientProps();
      const client = Client._instantiate(props);

      expect(client.props).toBeDefined();
      expect(Object.keys(client.props)).toEqual([
        'id',
        'active',
        'type',
        'document',
        'ie',
        'groupId',
        'resaleId',
        'parentClientId',
        'isSubClient',
        'companyIds',
        'invoiceType',
        'generateInvoice',
        'companyName',
        'fantasyName',
        'socialName',
        'domain',
        'headquarters',
      ]);
    });
  });

  describe('isActive', () => {
    it('should return true for isActive when status is ACTIVE', () => {
      const client = Client._instantiate({ ...makeClientProps(), active: true });

      expect(client.isActive()).toBe(true);
    });

    it('should return false for isActive when status is not ACTIVE', () => {
      const client = Client._instantiate({ ...makeClientProps(), active: false });

      expect(client.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the client', () => {
      const client = Client._instantiate({ ...makeClientProps(), active: false });

      client.activate();

      expect(client.isActive()).toBe(true);
    });

    it('should deactivate the client', () => {
      const client = Client._instantiate({ ...makeClientProps(), active: true });

      client.deactivate();

      expect(client.isActive()).toBe(false);
    });

    it('should toggle between active and inactive', () => {
      const client = Client._instantiate({ ...makeClientProps(), active: false });

      client.activate();
      expect(client.isActive()).toBe(true);

      client.deactivate();
      expect(client.isActive()).toBe(false);

      client.activate();
      expect(client.isActive()).toBe(true);

      client.deactivate();
      expect(client.isActive()).toBe(false);
    });
  });
});
