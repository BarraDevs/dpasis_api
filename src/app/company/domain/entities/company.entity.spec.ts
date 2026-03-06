import { Company, CompanyProps } from './company.entity';

function makeCompanyProps(overrides?: Partial<CompanyProps>): CompanyProps {
  return {
    id: 1,
    name: 'Empresa LTDA',
    fantasyName: 'Empresa',
    document: '12345678000199',
    ie: '123456789',
    active: true,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: 'Sala 1',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone01: '1133334444',
    phone02: null,
    cellphone: '11999998888',
    email01: 'contato@empresa.com',
    email02: null,
    ...overrides,
  };
}

describe('Company', () => {
  describe('_instantiate', () => {
    it('should create a Company instance with the provided props', () => {
      const props = makeCompanyProps();

      const company = Company._instantiate(props);

      expect(company).toBeInstanceOf(Company);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeCompanyProps({
        id: 42,
        active: false,
        name: 'Custom Company',
        fantasyName: 'Custom Fantasy Name',
        document: '12345678909',
        ie: '123456789',
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        complement: 'Sala 1',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '1133334444',
        phone02: null,
        cellphone: '11999998888',
        email01: 'contato@empresa.com',
        email02: null,
      });

      const company = Company._instantiate(props);

      expect(company.props).toEqual({
        id: 42,
        active: false,
        name: 'Custom Company',
        fantasyName: 'Custom Fantasy Name',
        document: '12345678909',
        ie: '123456789',
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        complement: 'Sala 1',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '1133334444',
        phone02: null,
        cellphone: '11999998888',
        email01: 'contato@empresa.com',
        email02: null,
      });
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeCompanyProps();
      const company = Company._instantiate(props);

      const returnedProps = company.props;
      (returnedProps as Record<string, unknown>).name = 'Modified Name';

      expect(company.props.name).toBe('Empresa LTDA');
    });
  });

  describe('isActive', () => {
    it('should return true for isActive when status is active', () => {
      const company = Company._instantiate({ ...makeCompanyProps(), active: true });

      expect(company.isActive()).toBe(true);
    });

    it('should return false for isActive when status is not active', () => {
      const company = Company._instantiate({ ...makeCompanyProps(), active: false });

      expect(company.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the company', () => {
      const company = Company._instantiate({ ...makeCompanyProps(), active: false });

      company.activate();

      expect(company.isActive()).toBe(true);
    });

    it('should deactivate the company', () => {
      const company = Company._instantiate({ ...makeCompanyProps(), active: true });

      company.deactivate();

      expect(company.isActive()).toBe(false);
    });

    it('should keep active as true when company is already active', () => {
      const company = Company._instantiate({ ...makeCompanyProps(), active: true });

      company.activate();

      expect(company.isActive()).toBe(true);
    });

    it('should keep active as false when company is already inactive', () => {
      const company = Company._instantiate({ ...makeCompanyProps(), active: false });

      company.deactivate();

      expect(company.isActive()).toBe(false);
    });
  });
});
