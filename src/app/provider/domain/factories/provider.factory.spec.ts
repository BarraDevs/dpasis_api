import { InvalidProviderTypeFieldsError } from '../errors/invalid-provider-type-fields.error';
import { ProviderCreateProps, ProviderProps } from '../entities/provider.entity';
import { ProviderType } from '../enums/provider-type.enum';
import { ProviderFactory } from './provider.factory';

function makeProviderCreateProps(overrides?: Partial<ProviderCreateProps>): ProviderCreateProps {
  return {
    name: 'Prestador LTDA',
    type: ProviderType.ONE_OFF,
    valueInCents: 150000,
    document: '09.748.165/0001-10',
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
    it('should create provider with ONE_OFF type and deadline', () => {
      const provider = ProviderFactory.create(makeProviderCreateProps());

      expect(provider.props.id).toBe(0);
      expect(provider.props.active).toBe(true);
      expect(provider.props.type).toBe(ProviderType.ONE_OFF);
      expect(provider.props.deadline).toBe(30);
      expect(provider.props.paymentDate).toBeNull();
      expect(provider.props.document).toBe('09748165000110');
      expect(provider.props.email).toBe('contato@prestador.com');
    });

    it('should create provider with RECURRING type and paymentDate', () => {
      const provider = ProviderFactory.create(makeProviderCreateProps({
        type: ProviderType.RECURRING,
        paymentDate: 15,
        deadline: null,
      }));

      expect(provider.props.type).toBe(ProviderType.RECURRING);
      expect(provider.props.paymentDate).toBe(15);
      expect(provider.props.deadline).toBeNull();
    });

    it('should throw when ONE_OFF without deadline', () => {
      expect(() => ProviderFactory.create(makeProviderCreateProps({ deadline: null })))
        .toThrow(InvalidProviderTypeFieldsError);
    });

    it('should throw when RECURRING without paymentDate', () => {
      expect(() => ProviderFactory.create(makeProviderCreateProps({
        type: ProviderType.RECURRING,
        paymentDate: null,
        deadline: null,
      }))).toThrow(InvalidProviderTypeFieldsError);
    });

    it('should throw when paymentDate is greater than 31', () => {
      expect(() => ProviderFactory.create(makeProviderCreateProps({
        type: ProviderType.RECURRING,
        paymentDate: 32,
        deadline: null,
      }))).toThrow(InvalidProviderTypeFieldsError);
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
