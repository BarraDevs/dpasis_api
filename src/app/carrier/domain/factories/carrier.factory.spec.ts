import { AppException } from 'src/core/filters/app.exception';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { CarrierCreateProps, CarrierProps } from '../entities/carrier.entity';
import { CarrierFactory } from './carrier.factory';

function makeCarrierCreateProps(overrides?: Partial<CarrierCreateProps>): CarrierCreateProps {
  return {
    name: 'Transportadora LTDA',
    fantasyName: 'Transportadora',
    representative: 'João Silva',
    document: '09.748.165/0001-10',
    contact: 'João Silva - (11) 99999-9999',
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

function makeCarrierProps(overrides?: Partial<CarrierProps>): CarrierProps {
  return {
    id: 1,
    active: true,
    ...makeCarrierCreateProps(),
    ...overrides,
  };
}

describe('CarrierFactory', () => {
  describe('create', () => {
    it('should create a carrier with valid props', () => {
      const props = makeCarrierCreateProps();

      const carrier = CarrierFactory.create(props);

      expect(carrier).toBeDefined();
      expect(carrier.props.id).toBe(0);
      expect(carrier.props.active).toBe(true);
      expect(carrier.props.name).toBe('Transportadora LTDA');
      expect(carrier.props.document).toBe('09748165000110');
    });

    it('should create a carrier with optional complement filled', () => {
      const props = makeCarrierCreateProps({ complement: 'Sala 1' });

      const carrier = CarrierFactory.create(props);

      expect(carrier.props.complement).toBe('Sala 1');
    });

    describe('validation - name', () => {
      it.each([null, undefined, '', '   '])(
        'should throw when name is empty (%s)',
        (name: unknown) => {
          const props = makeCarrierCreateProps({ name: name as string });

          expect(() => CarrierFactory.create(props)).toThrow(AppException);
          expect(() => CarrierFactory.create(props)).toThrow('O campo name não pode ser vazio');
        },
      );
    });

    describe('validation - document', () => {
      it('should throw InvalidDocumentError when document has invalid format', () => {
        const props = makeCarrierCreateProps({ document: '123' });

        expect(() => CarrierFactory.create(props)).toThrow(InvalidDocumentError);
      });
    });
  });

  describe('load', () => {
    it('should load a carrier with the provided props', () => {
      const props = makeCarrierProps({
        id: 1,
        active: false,
        name: 'Loaded Carrier',
      });

      const carrier = CarrierFactory.load(props);

      expect(carrier.props.id).toBe(1);
      expect(carrier.props.active).toBe(false);
      expect(carrier.props.name).toBe('Loaded Carrier');
    });
  });
});
