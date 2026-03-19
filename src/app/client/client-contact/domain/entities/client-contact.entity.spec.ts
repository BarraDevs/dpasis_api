import { ClientContact, ClientContactProps } from './client-contact.entity';

function makeClientContactProps(overrides?: Partial<ClientContactProps>): ClientContactProps {
  return {
    id: 1,
    clientId: 10,
    departmentId: 5,
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    whatsapp: '11988888888',
    observations: 'Contato principal',
    receiveNF: true,
    active: true,
    ...overrides,
  };
}

describe('ClientContact', () => {
  describe('_instantiate', () => {
    it('should create a ClientContact instance with the provided props', () => {
      const props = makeClientContactProps();

      const clientContact = ClientContact._instantiate(props);

      expect(clientContact).toBeInstanceOf(ClientContact);
    });

    it('should create a ClientContact with null id (before persistence)', () => {
      const props = makeClientContactProps({ id: null });

      const clientContact = ClientContact._instantiate(props);

      expect(clientContact.props.id).toBeNull();
    });

    it('should create a ClientContact with null phone when not provided', () => {
      const props = makeClientContactProps({ phone: null });

      const clientContact = ClientContact._instantiate(props);

      expect(clientContact.props.phone).toBeNull();
    });

    it('should create a ClientContact with null whatsapp when not provided', () => {
      const props = makeClientContactProps({ whatsapp: null });

      const clientContact = ClientContact._instantiate(props);

      expect(clientContact.props.whatsapp).toBeNull();
    });

    it('should create a ClientContact with null observations when not provided', () => {
      const props = makeClientContactProps({ observations: null });

      const clientContact = ClientContact._instantiate(props);

      expect(clientContact.props.observations).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeClientContactProps({
        id: 42,
        clientId: 20,
        departmentId: 8,
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11977777777',
        whatsapp: '11966666666',
        observations: 'Observação',
        receiveNF: false,
      });

      const clientContact = ClientContact._instantiate(props);

      expect(clientContact.props.id).toBe(42);
      expect(clientContact.props.clientId).toBe(20);
      expect(clientContact.props.departmentId).toBe(8);
      expect(clientContact.props.name).toBe('Maria Santos');
      expect(clientContact.props.email).toBe('maria@example.com');
      expect(clientContact.props.phone).toBe('11977777777');
      expect(clientContact.props.whatsapp).toBe('11966666666');
      expect(clientContact.props.observations).toBe('Observação');
      expect(clientContact.props.receiveNF).toBe(false);
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeClientContactProps();
      const clientContact = ClientContact._instantiate(props);

      const returnedProps = clientContact.props;
      (returnedProps as Record<string, unknown>).name = 'Modified Name';

      expect(clientContact.props.name).toBe('João Silva');
    });

    it('should return all expected props', () => {
      const props = makeClientContactProps();
      const clientContact = ClientContact._instantiate(props);

      expect(clientContact.props).toBeDefined();
      expect(Object.keys(clientContact.props)).toEqual([
        'id',
        'clientId',
        'departmentId',
        'name',
        'email',
        'phone',
        'whatsapp',
        'observations',
        'receiveNF',
        'active',
      ]);
    });
  });

  describe('isActive', () => {
    it('should return true when active is true', () => {
      const clientContact = ClientContact._instantiate(
        makeClientContactProps({ active: true }),
      );

      expect(clientContact.isActive()).toBe(true);
    });

    it('should return false when active is false', () => {
      const clientContact = ClientContact._instantiate(
        makeClientContactProps({ active: false }),
      );

      expect(clientContact.isActive()).toBe(false);
    });
  });

  describe('activate', () => {
    it('should set active to true', () => {
      const clientContact = ClientContact._instantiate(
        makeClientContactProps({ active: false }),
      );

      clientContact.activate();

      expect(clientContact.isActive()).toBe(true);
      expect(clientContact.props.active).toBe(true);
    });

    it('should keep active true when already active', () => {
      const clientContact = ClientContact._instantiate(
        makeClientContactProps({ active: true }),
      );

      clientContact.activate();

      expect(clientContact.isActive()).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should set active to false', () => {
      const clientContact = ClientContact._instantiate(
        makeClientContactProps({ active: true }),
      );

      clientContact.deactivate();

      expect(clientContact.isActive()).toBe(false);
      expect(clientContact.props.active).toBe(false);
    });

    it('should keep active false when already inactive', () => {
      const clientContact = ClientContact._instantiate(
        makeClientContactProps({ active: false }),
      );

      clientContact.deactivate();

      expect(clientContact.isActive()).toBe(false);
    });
  });
});
