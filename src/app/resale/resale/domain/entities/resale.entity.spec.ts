import { Resale, ResaleProps } from './resale.entity';

function makeResaleProps(overrides?: Partial<ResaleProps>): ResaleProps {
  return {
    id: 1,
    active: true,
    name: 'Revenda Exemplo',
    identifier: null,
    zipCode: '01310-100',
    street: 'Av Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    licenseType: 'A1',
    document: '12345678000199',
    ie: null,
    phone01: '11999999999',
    phone02: null,
    voucher: null,
    email: null,
    website: null,
    nickname: null,
    socialName: null,
    validityDate: null,
    accessEmail: null,
    accessPassword: null,
    paymentDay: null,
    bonus: null,
    billingStartDay: null,
    receivesSupportEmail: false,
    servedByRoot: false,
    manufacturerResale: false,
    indicatorResale: false,
    recurringResale: false,
    profilePictureUrl: null,
    ...overrides,
  };
}

describe('Resale', () => {
  describe('_instantiate', () => {
    it('should create a Resale instance with the provided props', () => {
      const props = makeResaleProps();
      const resale = Resale._instantiate(props);
      expect(resale).toBeInstanceOf(Resale);
    });
  });

  describe('props', () => {
    it('should return a copy of props (immutability)', () => {
      const props = makeResaleProps();
      const resale = Resale._instantiate(props);
      const returnedProps = resale.props;
      (returnedProps as Record<string, unknown>).name = 'Modified';
      expect(resale.props.name).toBe('Revenda Exemplo');
    });
  });

  describe('isActive', () => {
    it('should return true when active', () => {
      const resale = Resale._instantiate({ ...makeResaleProps(), active: true });
      expect(resale.isActive()).toBe(true);
    });

    it('should return false when inactive', () => {
      const resale = Resale._instantiate({ ...makeResaleProps(), active: false });
      expect(resale.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the resale', () => {
      const resale = Resale._instantiate({ ...makeResaleProps(), active: false });
      resale.activate();
      expect(resale.isActive()).toBe(true);
    });

    it('should deactivate the resale', () => {
      const resale = Resale._instantiate({ ...makeResaleProps(), active: true });
      resale.deactivate();
      expect(resale.isActive()).toBe(false);
    });

    it('should keep resale active when activate is called twice', () => {
      const resale = Resale._instantiate({ ...makeResaleProps(), active: true });
      resale.activate();
      resale.activate();
      expect(resale.isActive()).toBe(true);
      expect(resale.props.active).toBe(true);
    });

    it('should keep resale inactive when deactivate is called twice', () => {
      const resale = Resale._instantiate({ ...makeResaleProps(), active: false });
      resale.deactivate();
      resale.deactivate();
      expect(resale.isActive()).toBe(false);
      expect(resale.props.active).toBe(false);
    });

    it('should reflect toggles in props returned after each transition', () => {
      const resale = Resale._instantiate({ ...makeResaleProps(), active: true });
      resale.deactivate();
      expect(resale.props.active).toBe(false);
      resale.activate();
      expect(resale.props.active).toBe(true);
    });
  });

  describe('props snapshot', () => {
    it('should expose all fields from the internal state', () => {
      const props = makeResaleProps({
        id: 99,
        name: 'Revenda Norte',
        identifier: 'RN-99',
        active: false,
        receivesSupportEmail: true,
        manufacturerResale: true,
      });
      const resale = Resale._instantiate(props);

      expect(resale.props).toMatchObject({
        id: 99,
        name: 'Revenda Norte',
        identifier: 'RN-99',
        active: false,
        receivesSupportEmail: true,
        manufacturerResale: true,
      });
    });

    it('should expose extended resale fields (nickname, validity, access, billing flags)', () => {
      const validity = new Date('2026-08-15T12:00:00.000Z');
      const props = makeResaleProps({
        nickname: 'Central SP',
        socialName: 'Nome social exibido',
        validityDate: validity,
        accessEmail: 'painel@revenda.com',
        accessPassword: 'stored-secret',
        paymentDay: 12,
        bonus: 300,
        billingStartDay: 20,
        servedByRoot: true,
        indicatorResale: true,
        recurringResale: false,
      });
      const resale = Resale._instantiate(props);

      expect(resale.props).toMatchObject({
        nickname: 'Central SP',
        socialName: 'Nome social exibido',
        validityDate: validity,
        accessEmail: 'painel@revenda.com',
        accessPassword: 'stored-secret',
        paymentDay: 12,
        bonus: 300,
        billingStartDay: 20,
        servedByRoot: true,
        indicatorResale: true,
        recurringResale: false,
      });
    });
  });
});
