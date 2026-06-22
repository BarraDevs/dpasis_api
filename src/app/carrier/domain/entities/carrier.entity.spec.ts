import { Carrier, CarrierProps } from './carrier.entity';

function makeCarrierProps(overrides?: Partial<CarrierProps>): CarrierProps {
  return {
    id: 1,
    name: 'Transportadora LTDA',
    fantasyName: 'Transportadora',
    representative: 'João Silva',
    document: '12345678000199',
    contact: 'João Silva - (11) 99999-9999',
    active: true,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: 'Sala 1',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}

describe('Carrier', () => {
  describe('_instantiate', () => {
    it('should create a Carrier instance with the provided props', () => {
      const props = makeCarrierProps();

      const carrier = Carrier._instantiate(props);

      expect(carrier).toBeInstanceOf(Carrier);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeCarrierProps({
        id: 42,
        active: false,
        name: 'Custom Carrier',
      });

      const carrier = Carrier._instantiate(props);

      expect(carrier.props).toEqual<CarrierProps>(props);
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeCarrierProps();
      const carrier = Carrier._instantiate(props);

      const returnedProps = carrier.props;
      (returnedProps as Record<string, unknown>).name = 'Modified Name';

      expect(carrier.props.name).toBe('Transportadora LTDA');
    });
  });

  describe('isActive', () => {
    it('should return true for isActive when status is active', () => {
      const carrier = Carrier._instantiate({ ...makeCarrierProps(), active: true });

      expect(carrier.isActive()).toBe(true);
    });

    it('should return false for isActive when status is not active', () => {
      const carrier = Carrier._instantiate({ ...makeCarrierProps(), active: false });

      expect(carrier.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the carrier', () => {
      const carrier = Carrier._instantiate({ ...makeCarrierProps(), active: false });

      carrier.activate();

      expect(carrier.isActive()).toBe(true);
    });

    it('should deactivate the carrier', () => {
      const carrier = Carrier._instantiate({ ...makeCarrierProps(), active: true });

      carrier.deactivate();

      expect(carrier.isActive()).toBe(false);
    });
  });
});
