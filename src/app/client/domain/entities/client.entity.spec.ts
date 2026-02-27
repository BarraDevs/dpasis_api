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
    ownerId: 20,
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    companyName: 'Empresa LTDA',
    fantasyName: 'Empresa',
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
      expect(client.props.ownerId).toBe(20);
      expect(client.props.invoiceType).toBe(ClientInvoiceType.CONTRACT);
      expect(client.props.generateInvoice).toBe(true);
      expect(client.props.companyName).toBe('Custom Company');
      expect(client.props.fantasyName).toBe('Empresa');
      expect(client.props.headquarters).toBe('São Paulo');
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
        'ownerId',
        'invoiceType',
        'generateInvoice',
        'companyName',
        'fantasyName',
        'headquarters',
      ]);
    });
  });
});
