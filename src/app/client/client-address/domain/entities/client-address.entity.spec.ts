import { ClientAddressType } from '../enums/client-address-type.enum';
import { ClientAddress, ClientAddressProps } from './client-address.entity';

function makeClientAddressProps(overrides?: Partial<ClientAddressProps>): ClientAddressProps {
  return {
    id: 1,
    clientId: 10,
    type: ClientAddressType.MAIN,
    zipCode: '12345-678',
    street: 'Rua Teste',
    number: '123',
    complement: 'Apto 123',
    neighborhood: 'Bairro Teste',
    city: 'Cidade Teste',
    state: 'SP',
    active: true,
    ...overrides,
  };
}

describe('ClientAddress Entity', () => {
  describe('_instantiate', () => {
    it('should create a ClientAddress instance with the provided props', () => {
      const props = makeClientAddressProps();

      const clientAddress = ClientAddress._instantiate(props);

      expect(clientAddress).toBeInstanceOf(ClientAddress);
    });

    it('should create a ClientAddress with null id', () => {
      const props = makeClientAddressProps({ id: null });

      const clientAddress = ClientAddress._instantiate(props);

      expect(clientAddress.props.id).toBeNull();
    });

    it('should create a ClientAddress with null complement', () => {
      const props = makeClientAddressProps({ complement: null });

      const clientAddress = ClientAddress._instantiate(props);

      expect(clientAddress.props.complement).toBeNull();
    });

    it('should create a ClientAddress with different address types', () => {
      const props = makeClientAddressProps({ type: ClientAddressType.BILLING });

      const clientAddress = ClientAddress._instantiate(props);

      expect(clientAddress.props.type).toBe(ClientAddressType.BILLING);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeClientAddressProps({
        id: 42,
        clientId: 10,
        type: ClientAddressType.SUPPORT,
        zipCode: '98765-432',
        street: 'Av. Principal',
        number: '456',
        complement: 'Sala 10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        active: true,
      });

      const clientAddress = ClientAddress._instantiate(props);

      expect(clientAddress.props).toEqual({
        id: 42,
        clientId: 10,
        type: ClientAddressType.SUPPORT,
        zipCode: '98765-432',
        street: 'Av. Principal',
        number: '456',
        complement: 'Sala 10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        active: true,
      });
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeClientAddressProps();
      const clientAddress = ClientAddress._instantiate(props);

      const returnedProps = clientAddress.props;
      (returnedProps as Record<string, unknown>).street = 'Modified Street';

      expect(clientAddress.props.street).toBe('Rua Teste');
    });

    it('should return all expected props', () => {
      const props = makeClientAddressProps();
      const clientAddress = ClientAddress._instantiate(props);

      expect(clientAddress.props).toBeDefined();
      expect(Object.keys(clientAddress.props)).toEqual([
        'id',
        'clientId',
        'type',
        'zipCode',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'active',
      ]);
    });
  });

  describe('isMain', () => {
    it('should return true for isMain when type is MAIN', () => {
      const clientAddress = ClientAddress._instantiate(
        makeClientAddressProps({ type: ClientAddressType.MAIN }),
      );

      expect(clientAddress.isMain()).toBe(true);
    });

    it.each(
      Object.values(ClientAddressType).filter((type) => type !== ClientAddressType.MAIN),
    )('should return false for isMain when type is not MAIN', (type: ClientAddressType) => {
      const clientAddress = ClientAddress._instantiate(makeClientAddressProps({ type }));

      expect(clientAddress.isMain()).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true when active is true', () => {
      const clientAddress = ClientAddress._instantiate(
        makeClientAddressProps({ active: true }),
      );

      expect(clientAddress.isActive()).toBe(true);
    });

    it('should return false when active is false', () => {
      const clientAddress = ClientAddress._instantiate(
        makeClientAddressProps({ active: false }),
      );

      expect(clientAddress.isActive()).toBe(false);
    });

    it('should return true when active is undefined (default)', () => {
      const clientAddress = ClientAddress._instantiate(makeClientAddressProps());

      expect(clientAddress.isActive()).toBe(true);
    });
  });

  describe('activate', () => {
    it('should set active to true', () => {
      const clientAddress = ClientAddress._instantiate(
        makeClientAddressProps({ active: false }),
      );

      clientAddress.activate();

      expect(clientAddress.isActive()).toBe(true);
      expect(clientAddress.props.active).toBe(true);
    });

    it('should keep active true when already active', () => {
      const clientAddress = ClientAddress._instantiate(
        makeClientAddressProps({ active: true }),
      );

      clientAddress.activate();

      expect(clientAddress.isActive()).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should set active to false', () => {
      const clientAddress = ClientAddress._instantiate(
        makeClientAddressProps({ active: true }),
      );

      clientAddress.deactivate();

      expect(clientAddress.isActive()).toBe(false);
      expect(clientAddress.props.active).toBe(false);
    });

    it('should keep active false when already inactive', () => {
      const clientAddress = ClientAddress._instantiate(
        makeClientAddressProps({ active: false }),
      );

      clientAddress.deactivate();

      expect(clientAddress.isActive()).toBe(false);
    });
  });
});
