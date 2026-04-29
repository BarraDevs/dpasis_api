import { ResaleContact, ResaleContactProps } from './resale-contact.entity';

function makeResaleContactProps(overrides?: Partial<ResaleContactProps>): ResaleContactProps {
  return {
    id: 1,
    resaleId: 10,
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

describe('ResaleContact', () => {
  describe('_instantiate', () => {
    it('should create a ResaleContact instance with the provided props', () => {
      const props = makeResaleContactProps();

      const resaleContact = ResaleContact._instantiate(props);

      expect(resaleContact).toBeInstanceOf(ResaleContact);
    });

    it('should create a ResaleContact with null id (before persistence)', () => {
      const props = makeResaleContactProps({ id: null });

      const resaleContact = ResaleContact._instantiate(props);

      expect(resaleContact.props.id).toBeNull();
    });

    it('should create a ResaleContact with null phone when not provided', () => {
      const props = makeResaleContactProps({ phone: null });

      const resaleContact = ResaleContact._instantiate(props);

      expect(resaleContact.props.phone).toBeNull();
    });

    it('should create a ResaleContact with null whatsapp when not provided', () => {
      const props = makeResaleContactProps({ whatsapp: null });

      const resaleContact = ResaleContact._instantiate(props);

      expect(resaleContact.props.whatsapp).toBeNull();
    });

    it('should create a ResaleContact with null observations when not provided', () => {
      const props = makeResaleContactProps({ observations: null });

      const resaleContact = ResaleContact._instantiate(props);

      expect(resaleContact.props.observations).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeResaleContactProps({
        id: 42,
        resaleId: 20,
        departmentId: 8,
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11977777777',
        whatsapp: '11966666666',
        observations: 'Observação',
        receiveNF: false,
      });

      const resaleContact = ResaleContact._instantiate(props);

      expect(resaleContact.props.id).toBe(42);
      expect(resaleContact.props.resaleId).toBe(20);
      expect(resaleContact.props.departmentId).toBe(8);
      expect(resaleContact.props.name).toBe('Maria Santos');
      expect(resaleContact.props.email).toBe('maria@example.com');
      expect(resaleContact.props.phone).toBe('11977777777');
      expect(resaleContact.props.whatsapp).toBe('11966666666');
      expect(resaleContact.props.observations).toBe('Observação');
      expect(resaleContact.props.receiveNF).toBe(false);
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeResaleContactProps();
      const resaleContact = ResaleContact._instantiate(props);

      const returnedProps = resaleContact.props;
      (returnedProps as Record<string, unknown>).name = 'Modified Name';

      expect(resaleContact.props.name).toBe('João Silva');
    });

    it('should return all expected props', () => {
      const props = makeResaleContactProps();
      const resaleContact = ResaleContact._instantiate(props);

      expect(resaleContact.props).toBeDefined();
      expect(Object.keys(resaleContact.props)).toEqual([
        'id',
        'resaleId',
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
      const resaleContact = ResaleContact._instantiate(
        makeResaleContactProps({ active: true }),
      );

      expect(resaleContact.isActive()).toBe(true);
    });

    it('should return false when active is false', () => {
      const resaleContact = ResaleContact._instantiate(
        makeResaleContactProps({ active: false }),
      );

      expect(resaleContact.isActive()).toBe(false);
    });
  });

  describe('activate', () => {
    it('should set active to true', () => {
      const resaleContact = ResaleContact._instantiate(
        makeResaleContactProps({ active: false }),
      );

      resaleContact.activate();

      expect(resaleContact.isActive()).toBe(true);
      expect(resaleContact.props.active).toBe(true);
    });

    it('should keep active true when already active', () => {
      const resaleContact = ResaleContact._instantiate(
        makeResaleContactProps({ active: true }),
      );

      resaleContact.activate();

      expect(resaleContact.isActive()).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should set active to false', () => {
      const resaleContact = ResaleContact._instantiate(
        makeResaleContactProps({ active: true }),
      );

      resaleContact.deactivate();

      expect(resaleContact.isActive()).toBe(false);
      expect(resaleContact.props.active).toBe(false);
    });

    it('should keep active false when already inactive', () => {
      const resaleContact = ResaleContact._instantiate(
        makeResaleContactProps({ active: false }),
      );

      resaleContact.deactivate();

      expect(resaleContact.isActive()).toBe(false);
    });
  });
});
