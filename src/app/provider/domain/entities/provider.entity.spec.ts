import { ProviderType } from '../enums/provider-type.enum';
import { Provider, ProviderProps } from './provider.entity';

function makeProviderProps(overrides?: Partial<ProviderProps>): ProviderProps {
  return {
    id: 1,
    name: 'Prestador LTDA',
    type: ProviderType.ONE_OFF,
    valueInCents: 150000,
    document: '09748165000110',
    ie: null,
    paymentDate: null,
    deadline: 30,
    fantasyName: 'Prestador',
    email: 'contato@prestador.com',
    website: 'https://prestador.com',
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    active: true,
    ...overrides,
  };
}

describe('Provider - Unit tests', () => {
  describe('_instantiate', () => {
    it('should create a Provider instance with the provided props', () => {
      const props = makeProviderProps();

      const provider = Provider._instantiate(props);

      expect(provider).toBeInstanceOf(Provider);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeProviderProps({ id: 42, active: false });

      const provider = Provider._instantiate(props);

      expect(provider.props).toEqual(props);
    });

    it('should return a copy of props (immutability)', () => {
      const provider = Provider._instantiate(makeProviderProps());

      const returnedProps = provider.props;
      (returnedProps as Record<string, unknown>).name = 'Modified Name';

      expect(provider.props.name).toBe('Prestador LTDA');
    });
  });

  describe('isActive', () => {
    it('should return true when active', () => {
      const provider = Provider._instantiate(makeProviderProps({ active: true }));

      expect(provider.isActive()).toBe(true);
    });

    it('should return false when inactive', () => {
      const provider = Provider._instantiate(makeProviderProps({ active: false }));

      expect(provider.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the provider', () => {
      const provider = Provider._instantiate(makeProviderProps({ active: false }));

      provider.activate();

      expect(provider.isActive()).toBe(true);
    });

    it('should deactivate the provider', () => {
      const provider = Provider._instantiate(makeProviderProps({ active: true }));

      provider.deactivate();

      expect(provider.isActive()).toBe(false);
    });
  });
});
