import { ProviderCreateProps, ProviderProps } from '../entities/provider.entity';
import { ProviderFactory } from './provider.factory';

function makeProviderCreateProps(overrides?: Partial<ProviderCreateProps>): ProviderCreateProps {
  return {
    name: 'Prestador LTDA',
    document: '09.748.165/0001-10',
    ie: null,
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
    ...overrides,
  };
}

function makeProviderProps(overrides?: Partial<ProviderProps>): ProviderProps {
  return {
    id: 1,
    active: true,
    ...makeProviderCreateProps(),
    ...overrides,
  };
}

describe('ProviderFactory - Unit tests', () => {
  describe('create', () => {
    it('should create provider with valid props', () => {
      const provider = ProviderFactory.create(makeProviderCreateProps());

      expect(provider.props.id).toBe(0);
      expect(provider.props.active).toBe(true);
      expect(provider.props.document).toBe('09748165000110');
      expect(provider.props.email).toBe('contato@prestador.com');
    });

    it('should create provider with optional fields filled', () => {
      const provider = ProviderFactory.create(makeProviderCreateProps({
        ie: '123456789',
        complement: 'Sala 1',
      }));

      expect(provider.props.ie).toBe('123456789');
      expect(provider.props.complement).toBe('Sala 1');
    });
  });

  describe('edit', () => {
    it('should edit provider preserving id and active', () => {
      const provider = ProviderFactory.edit(makeProviderProps({
        name: 'Nome Atualizado',
      }));

      expect(provider.props.id).toBe(1);
      expect(provider.props.active).toBe(true);
      expect(provider.props.name).toBe('Nome Atualizado');
    });
  });

  describe('load', () => {
    it('should load provider without re-validation', () => {
      const provider = ProviderFactory.load(makeProviderProps());

      expect(provider.props.id).toBe(1);
      expect(provider.props.name).toBe('Prestador LTDA');
    });
  });
});
