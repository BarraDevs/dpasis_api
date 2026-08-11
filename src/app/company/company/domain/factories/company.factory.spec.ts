import { AppException } from 'src/core/filters/app.exception';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { CompanyCreateProps, CompanyProps } from '../entities/company.entity';
import { CompanyFactory } from './company.factory';

function makeCompanyCreateProps(overrides?: Partial<CompanyCreateProps>): CompanyCreateProps {
  return {
    name: 'Empresa LTDA',
    fantasyName: 'Empresa',
    document: '09.748.165/0001-10',
    ie: null,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone01: '1133334444',
    phone02: null,
    cellphone: null,
    email01: 'contato@empresa.com',
    email02: null,
    ...overrides,
  };
}

function makeCompanyProps(overrides?: Partial<CompanyProps>): CompanyProps {
  return {
    id: 1,
    active: true,
    name: 'Empresa LTDA',
    fantasyName: 'Empresa',
    document: '09.748.165/0001-10',
    ie: null,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone01: '1133334444',
    phone02: null,
    cellphone: null,
    email01: 'contato@empresa.com',
    email02: null,
    ...overrides,
  };
}

describe('CompanyFactory', () => {
  describe('create', () => {
    it('should create a company with valid props', () => {
      const props = makeCompanyCreateProps();

      const company = CompanyFactory.create(props);

      expect(company).toBeDefined();
      expect(company.props.id).toBe(0);
      expect(company.props.active).toBe(true);
      expect(company.props.name).toBe('Empresa LTDA');
      expect(company.props.document).toBe('09748165000110');
    });

    it('should create a company with optional fields filled', () => {
      const props = makeCompanyCreateProps({
        ie: '123456789',
        complement: 'Sala 1',
        phone02: '1144445555',
        cellphone: '11999998888',
        email02: 'vendas@empresa.com',
      });

      const company = CompanyFactory.create(props);

      expect(company.props.ie).toBe('123456789');
      expect(company.props.complement).toBe('Sala 1');
      expect(company.props.phone02).toBe('1144445555');
      expect(company.props.cellphone).toBe('11999998888');
      expect(company.props.email02).toBe('vendas@empresa.com');
    });

    describe('validation - name', () => {
      it.each([null, undefined, '', '   '])(
        'should throw when name is empty (%s)',
        (name: unknown) => {
          const props = makeCompanyCreateProps({ name: name as string });

          expect(() => CompanyFactory.create(props)).toThrow(AppException);
          expect(() => CompanyFactory.create(props)).toThrow('O campo name não pode ser vazio');
        },
      );
    });

    describe('validation - document', () => {
      it.each([null, undefined, '', '   '])(
        'should throw when document is empty (%s)',
        (document: unknown) => {
          const props = makeCompanyCreateProps({ document: document as string });

          expect(() => CompanyFactory.create(props)).toThrow();
        },
      );

      it('should throw InvalidDocumentError when document has invalid format', () => {
        const props = makeCompanyCreateProps({ document: '123' });

        expect(() => CompanyFactory.create(props)).toThrow(InvalidDocumentError);
      });
    });
  });

  describe('load', () => {
    it('should load a company with the provided props', () => {
      const props = makeCompanyProps({
        id: 1,
        active: false,
        name: 'Loaded Company',
      });

      const company = CompanyFactory.load(props);

      expect(company.props.id).toBe(1);
      expect(company.props.active).toBe(false);
      expect(company.props.name).toBe('Loaded Company');
    });
  });
});
