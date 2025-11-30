import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import { InvalidCnpjError } from 'src/shared/value-objects/vo-errors';
import { Company } from './company.entity';

describe('Company Entity', () => {
  const validProps = {
    name: 'Tech Solutions Ltda',
    fantasyName: 'Tech Solutions',
    document: '55.967.002/0001-46',
    ie: '123.456.789.012',
    zipCode: '12345-678',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Sala 101',
    reference: 'Próximo ao metrô',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone01: '(11) 3333-4444',
    phone02: '(11) 3333-5555',
    cellphone: '(11) 99999-8888',
    email01: 'contato@techsolutions.com',
    email02: 'vendas@techsolutions.com',
  };

  describe('create', () => {
    it('should create a new company with active=true and timestamps', () => {
      // Act
      const company = Company.create(validProps);

      // Assert
      expect(company).toBeInstanceOf(Company);
      expect(company.props.id).toBeDefined();
      expect(company.props.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(company.props.name).toBe(validProps.name);
      expect(company.props.fantasyName).toBe(validProps.fantasyName);
      expect(company.props.document).toBe('55967002000146'); // Sanitized
      expect(company.props.ie).toBe(validProps.ie);
      expect(company.props.zipCode).toBe(validProps.zipCode);
      expect(company.props.street).toBe(validProps.street);
      expect(company.props.number).toBe(validProps.number);
      expect(company.props.complement).toBe(validProps.complement);
      expect(company.props.reference).toBe(validProps.reference);
      expect(company.props.neighborhood).toBe(validProps.neighborhood);
      expect(company.props.city).toBe(validProps.city);
      expect(company.props.state).toBe(validProps.state);
      expect(company.props.phone01).toBe('1133334444'); // Sanitized
      expect(company.props.phone02).toBe('1133335555'); // Sanitized
      expect(company.props.cellphone).toBe('11999998888'); // Sanitized
      expect(company.props.email01).toBe(validProps.email01);
      expect(company.props.email02).toBe(validProps.email02);
      expect(company.props.active).toBe(true);
      expect(company.props.createdAt).toBeInstanceOf(Date);
      expect(company.props.updatedAt).toBeInstanceOf(Date);
    });

    it('should create company with null optional fields', () => {
      // Arrange
      const propsWithNulls = {
        ...validProps,
        complement: null,
        reference: null,
        phone02: null,
        cellphone: null,
        email02: null,
      };

      // Act
      const company = Company.create(propsWithNulls);

      // Assert
      expect(company.props.complement).toBeNull();
      expect(company.props.reference).toBeNull();
      expect(company.props.phone02).toBeNull();
      expect(company.props.cellphone).toBeNull();
      expect(company.props.email02).toBeNull();
    });

    it('should sanitize document removing special characters', () => {
      // Arrange
      const props = {
        ...validProps,
        document: '55.967.002/0001-46',
      };

      // Act
      const company = Company.create(props);

      // Assert
      expect(company.props.document).toBe('55967002000146');
    });

    it('should sanitize phones removing special characters', () => {
      // Arrange
      const props = {
        ...validProps,
        phone01: '(11) 1111-2222',
        phone02: '(11) 3333-4444',
        cellphone: '(11) 98888-7777',
      };

      // Act
      const company = Company.create(props);

      // Assert
      expect(company.props.phone01).toBe('1111112222');
      expect(company.props.phone02).toBe('1133334444');
      expect(company.props.cellphone).toBe('11988887777');
    });

    it('should validate and accept valid emails', () => {
      // Arrange
      const props = {
        ...validProps,
        email01: 'valid.email@example.com',
        email02: 'another.email@example.com.br',
      };

      // Act
      const company = Company.create(props);

      // Assert
      expect(company.props.email01).toBe('valid.email@example.com');
      expect(company.props.email02).toBe('another.email@example.com.br');
    });

    it('should throw InvalidDocumentError for invalid document', () => {
      // Arrange
      const props = {
        ...validProps,
        document: '00.000.000/0000-00', // Invalid CNPJ
      };

      // Act & Assert
      expect(() => Company.create(props)).toThrow(InvalidCnpjError);
    });

    it('should throw InvalidEmailError for invalid email01', () => {
      // Arrange
      const props = {
        ...validProps,
        email01: 'invalid-email',
      };

      // Act & Assert
      expect(() => Company.create(props)).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for invalid email02', () => {
      // Arrange
      const props = {
        ...validProps,
        email02: 'invalid@',
      };

      // Act & Assert
      expect(() => Company.create(props)).toThrow(InvalidEmailError);
    });

    it('should throw InvalidPhoneError for invalid phone01', () => {
      // Arrange
      const props = {
        ...validProps,
        phone01: '123', // Too short
      };

      // Act & Assert
      expect(() => Company.create(props)).toThrow(InvalidPhoneError);
    });

    it('should throw InvalidPhoneError for invalid phone02', () => {
      // Arrange
      const props = {
        ...validProps,
        phone02: 'abcdefghij',
      };

      // Act & Assert
      expect(() => Company.create(props)).toThrow(InvalidPhoneError);
    });

    it('should throw InvalidPhoneError for invalid cellphone', () => {
      // Arrange
      const props = {
        ...validProps,
        cellphone: '11 9',
      };

      // Act & Assert
      expect(() => Company.create(props)).toThrow(InvalidPhoneError);
    });

    it('should generate different UUIDs for different instances', () => {
      // Act
      const company1 = Company.create(validProps);
      const company2 = Company.create(validProps);

      // Assert
      expect(company1.props.id).not.toBe(company2.props.id);
    });

    it('should set createdAt and updatedAt to current time', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const company = Company.create(validProps);

      // Assert
      const afterCreate = new Date();
      expect(company.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(company.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(company.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(company.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('load', () => {
    it('should load an existing company with all properties', () => {
      // Arrange
      const existingProps = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Existing Company Ltda',
        fantasyName: 'Existing Company',
        document: '55967002000146', // Already sanitized
        ie: '987.654.321.098',
        zipCode: '54321-876',
        street: 'Rua Existing',
        number: '500',
        complement: 'Andar 5',
        reference: 'Ao lado do banco',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        phone01: '2122223333', // Already sanitized
        phone02: '2144445555', // Already sanitized
        cellphone: '21987654321', // Already sanitized
        email01: 'existing@company.com',
        email02: 'contact@company.com',
        active: true,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-20T14:45:00Z'),
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company).toBeInstanceOf(Company);
      expect(company.props.id).toBe(existingProps.id);
      expect(company.props.name).toBe(existingProps.name);
      expect(company.props.fantasyName).toBe(existingProps.fantasyName);
      expect(company.props.document).toBe(existingProps.document);
      expect(company.props.ie).toBe(existingProps.ie);
      expect(company.props.zipCode).toBe(existingProps.zipCode);
      expect(company.props.street).toBe(existingProps.street);
      expect(company.props.number).toBe(existingProps.number);
      expect(company.props.complement).toBe(existingProps.complement);
      expect(company.props.reference).toBe(existingProps.reference);
      expect(company.props.neighborhood).toBe(existingProps.neighborhood);
      expect(company.props.city).toBe(existingProps.city);
      expect(company.props.state).toBe(existingProps.state);
      expect(company.props.phone01).toBe(existingProps.phone01);
      expect(company.props.phone02).toBe(existingProps.phone02);
      expect(company.props.cellphone).toBe(existingProps.cellphone);
      expect(company.props.email01).toBe(existingProps.email01);
      expect(company.props.email02).toBe(existingProps.email02);
      expect(company.props.active).toBe(existingProps.active);
      expect(company.props.createdAt).toBe(existingProps.createdAt);
      expect(company.props.updatedAt).toBe(existingProps.updatedAt);
    });

    it('should load company with active=false', () => {
      // Arrange
      const existingProps = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'Inactive Company',
        fantasyName: 'Inactive',
        document: '00365466000190',
        ie: '111222333444',
        zipCode: '99999-000',
        street: 'Street',
        number: '1',
        complement: null,
        reference: null,
        neighborhood: 'Hood',
        city: 'City',
        state: 'ST',
        phone01: '1122334455',
        phone02: null,
        cellphone: null,
        email01: 'inactive@company.com',
        email02: null,
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-10T00:00:00Z'),
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company.props.active).toBe(false);
    });

    it('should load company with null optional fields', () => {
      // Arrange
      const existingProps = {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: 'Minimal Company',
        fantasyName: 'Minimal',
        document: '00365466000190',
        ie: '222333444555',
        zipCode: '11111-222',
        street: 'Main St',
        number: '10',
        complement: null,
        reference: null,
        neighborhood: 'Downtown',
        city: 'Metropolis',
        state: 'MT',
        phone01: '1133445566',
        phone02: null,
        cellphone: null,
        email01: 'minimal@company.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-02-01T00:00:00Z'),
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company.props.complement).toBeNull();
      expect(company.props.reference).toBeNull();
      expect(company.props.phone02).toBeNull();
      expect(company.props.cellphone).toBeNull();
      expect(company.props.email02).toBeNull();
    });

    it('should sanitize document if loaded with formatting', () => {
      // Arrange
      const existingProps = {
        id: '423e4567-e89b-12d3-a456-426614174003',
        name: 'Company With Formatted Document',
        fantasyName: 'Formatted',
        document: '55.967.002/0001-46', // With formatting
        ie: '333444555666',
        zipCode: '22222-333',
        street: 'Avenue',
        number: '20',
        complement: null,
        reference: null,
        neighborhood: 'District',
        city: 'Town',
        state: 'TW',
        phone01: '1144556677',
        phone02: null,
        cellphone: null,
        email01: 'formatted@company.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-03-01T00:00:00Z'),
        updatedAt: new Date('2024-03-01T00:00:00Z'),
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company.props.document).toBe('55967002000146');
    });

    it('should sanitize phones if loaded with formatting', () => {
      // Arrange
      const existingProps = {
        id: '523e4567-e89b-12d3-a456-426614174004',
        name: 'Company With Formatted Phones',
        fantasyName: 'Phone Format',
        document: '00365466000190',
        ie: '444555666777',
        zipCode: '33333-444',
        street: 'Boulevard',
        number: '30',
        complement: null,
        reference: null,
        neighborhood: 'Area',
        city: 'Village',
        state: 'VL',
        phone01: '(11) 5555-6666', // With formatting
        phone02: '(11) 7777-8888', // With formatting
        cellphone: '(11) 99999-0000', // With formatting
        email01: 'phones@company.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-04-01T00:00:00Z'),
        updatedAt: new Date('2024-04-01T00:00:00Z'),
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company.props.phone01).toBe('1155556666');
      expect(company.props.phone02).toBe('1177778888');
      expect(company.props.cellphone).toBe('11999990000');
    });

    it('should validate and accept valid emails when loading', () => {
      // Arrange
      const existingProps = {
        id: '623e4567-e89b-12d3-a456-426614174005',
        name: 'Email Validation Company',
        fantasyName: 'Email Valid',
        document: '00365466000190',
        ie: '555666777888',
        zipCode: '44444-555',
        street: 'Lane',
        number: '40',
        complement: null,
        reference: null,
        neighborhood: 'Quarter',
        city: 'Hamlet',
        state: 'HM',
        phone01: '1166667777',
        phone02: null,
        cellphone: null,
        email01: 'valid.email@domain.com',
        email02: 'another.valid@domain.com.br',
        active: true,
        createdAt: new Date('2024-05-01T00:00:00Z'),
        updatedAt: new Date('2024-05-01T00:00:00Z'),
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company.props.email01).toBe('valid.email@domain.com');
      expect(company.props.email02).toBe('another.valid@domain.com.br');
    });

    it('should throw InvalidCnpjError when loading with invalid document', () => {
      // Arrange
      const existingProps = {
        id: '723e4567-e89b-12d3-a456-426614174006',
        name: 'Invalid Document Company',
        fantasyName: 'Invalid Doc',
        document: '00.000.000/0000-00', // Invalid CNPJ
        ie: '666777888999',
        zipCode: '55555-666',
        street: 'Road',
        number: '50',
        complement: null,
        reference: null,
        neighborhood: 'Zone',
        city: 'Municipality',
        state: 'MN',
        phone01: '1177778888',
        phone02: null,
        cellphone: null,
        email01: 'invalid@company.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-06-01T00:00:00Z'),
        updatedAt: new Date('2024-06-01T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Company.load(existingProps)).toThrow(InvalidCnpjError);
    });

    it('should throw InvalidEmailError when loading with invalid email01', () => {
      // Arrange
      const existingProps = {
        id: '823e4567-e89b-12d3-a456-426614174007',
        name: 'Invalid Email Company',
        fantasyName: 'Invalid Email',
        document: '00365466000190',
        ie: '777888999000',
        zipCode: '66666-777',
        street: 'Path',
        number: '60',
        complement: null,
        reference: null,
        neighborhood: 'Section',
        city: 'Borough',
        state: 'BR',
        phone01: '1188889999',
        phone02: null,
        cellphone: null,
        email01: 'not-an-email', // Invalid email
        email02: null,
        active: true,
        createdAt: new Date('2024-07-01T00:00:00Z'),
        updatedAt: new Date('2024-07-01T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Company.load(existingProps)).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError when loading with invalid email02', () => {
      // Arrange
      const existingProps = {
        id: '923e4567-e89b-12d3-a456-426614174008',
        name: 'Invalid Email2 Company',
        fantasyName: 'Invalid Email2',
        document: '00365466000190',
        ie: '888999000111',
        zipCode: '77777-888',
        street: 'Drive',
        number: '70',
        complement: null,
        reference: null,
        neighborhood: 'Block',
        city: 'Township',
        state: 'TS',
        phone01: '1199990000',
        phone02: null,
        cellphone: null,
        email01: 'valid@company.com',
        email02: 'invalid@', // Invalid email
        active: true,
        createdAt: new Date('2024-08-01T00:00:00Z'),
        updatedAt: new Date('2024-08-01T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Company.load(existingProps)).toThrow(InvalidEmailError);
    });

    it('should throw InvalidPhoneError when loading with invalid phone01', () => {
      // Arrange
      const existingProps = {
        id: 'a23e4567-e89b-12d3-a456-426614174009',
        name: 'Invalid Phone Company',
        fantasyName: 'Invalid Phone',
        document: '00365466000190',
        ie: '999000111222',
        zipCode: '88888-999',
        street: 'Circle',
        number: '80',
        complement: null,
        reference: null,
        neighborhood: 'Ward',
        city: 'Burg',
        state: 'BG',
        phone01: '123', // Too short
        phone02: null,
        cellphone: null,
        email01: 'phone@company.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-09-01T00:00:00Z'),
        updatedAt: new Date('2024-09-01T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Company.load(existingProps)).toThrow(InvalidPhoneError);
    });

    it('should throw InvalidPhoneError when loading with invalid phone02', () => {
      // Arrange
      const existingProps = {
        id: 'b23e4567-e89b-12d3-a456-426614174010',
        name: 'Invalid Phone2 Company',
        fantasyName: 'Invalid Phone2',
        document: '00365466000190',
        ie: '000111222333',
        zipCode: '99999-000',
        street: 'Square',
        number: '90',
        complement: null,
        reference: null,
        neighborhood: 'Parish',
        city: 'County',
        state: 'CT',
        phone01: '1100001111',
        phone02: 'abc123defg', // Invalid
        cellphone: null,
        email01: 'phone2@company.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-10-01T00:00:00Z'),
        updatedAt: new Date('2024-10-01T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Company.load(existingProps)).toThrow(InvalidPhoneError);
    });

    it('should throw InvalidPhoneError when loading with invalid cellphone', () => {
      // Arrange
      const existingProps = {
        id: 'c23e4567-e89b-12d3-a456-426614174011',
        name: 'Invalid Cellphone Company',
        fantasyName: 'Invalid Cell',
        document: '00365466000190',
        ie: '111222333444',
        zipCode: '00000-111',
        street: 'Court',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Region',
        city: 'District',
        state: 'DT',
        phone01: '1111112222',
        phone02: null,
        cellphone: '11 9', // Too short
        email01: 'cell@company.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-11-01T00:00:00Z'),
        updatedAt: new Date('2024-11-01T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Company.load(existingProps)).toThrow(InvalidPhoneError);
    });

    it('should preserve original timestamps when loading', () => {
      // Arrange
      const createdAt = new Date('2024-01-01T12:00:00Z');
      const updatedAt = new Date('2024-06-15T18:30:00Z');
      const existingProps = {
        id: 'd23e4567-e89b-12d3-a456-426614174012',
        name: 'Timestamp Preservation Company',
        fantasyName: 'Timestamp',
        document: '00365466000190',
        ie: '222333444555',
        zipCode: '11111-222',
        street: 'Plaza',
        number: '110',
        complement: null,
        reference: null,
        neighborhood: 'Locality',
        city: 'Place',
        state: 'PL',
        phone01: '1122223333',
        phone02: null,
        cellphone: null,
        email01: 'timestamp@company.com',
        email02: null,
        active: true,
        createdAt,
        updatedAt,
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company.props.createdAt).toBe(createdAt);
      expect(company.props.updatedAt).toBe(updatedAt);
      expect(company.props.createdAt.getTime()).toBe(createdAt.getTime());
      expect(company.props.updatedAt.getTime()).toBe(updatedAt.getTime());
    });

    it('should load company with all optional fields populated', () => {
      // Arrange
      const existingProps = {
        id: 'e23e4567-e89b-12d3-a456-426614174013',
        name: 'Full Optional Company',
        fantasyName: 'Full Optional',
        document: '00365466000190',
        ie: '333444555666',
        zipCode: '22222-333',
        street: 'Parkway',
        number: '120',
        complement: 'Suite 200',
        reference: 'Next to the park',
        neighborhood: 'Uptown',
        city: 'Megalopolis',
        state: 'MG',
        phone01: '1133334444',
        phone02: '1155556666',
        cellphone: '11977778888',
        email01: 'primary@company.com',
        email02: 'secondary@company.com',
        active: true,
        createdAt: new Date('2024-12-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z'),
      };

      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company.props.complement).toBe('Suite 200');
      expect(company.props.reference).toBe('Next to the park');
      expect(company.props.phone02).toBe('1155556666');
      expect(company.props.cellphone).toBe('11977778888');
      expect(company.props.email02).toBe('secondary@company.com');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle company status from active to inactive', () => {
      // Arrange
      const props = {
        id: 'toggle-test-id-1',
        name: 'Toggle Test Company',
        fantasyName: 'Toggle Test',
        document: '00365466000190',
        ie: '556677889900',
        zipCode: '77777-888',
        street: 'Toggle Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Toggle District',
        city: 'Toggle City',
        state: 'TG',
        phone01: '1166667777',
        phone02: null,
        cellphone: null,
        email01: 'toggle@test.com',
        email02: null,
        active: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      const company = Company.load(props);

      // Act
      company.toggleStatus();

      // Assert
      expect(company.props.active).toBe(false);
    });

    it('should toggle company status from inactive to active', () => {
      // Arrange
      const props = {
        id: 'toggle-test-id-2',
        name: 'Inactive Company',
        fantasyName: 'Inactive',
        document: '00365466000190',
        ie: '667788990011',
        zipCode: '88888-999',
        street: 'Inactive Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Inactive District',
        city: 'Inactive City',
        state: 'IN',
        phone01: '1177778888',
        phone02: null,
        cellphone: null,
        email01: 'inactive@test.com',
        email02: null,
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      const company = Company.load(props);

      // Act
      company.toggleStatus();

      // Assert
      expect(company.props.active).toBe(true);
    });

    it('should toggle status multiple times', () => {
      // Arrange
      const company = Company.create(validProps);

      // Act & Assert
      expect(company.props.active).toBe(true);

      company.toggleStatus();
      expect(company.props.active).toBe(false);

      company.toggleStatus();
      expect(company.props.active).toBe(true);

      company.toggleStatus();
      expect(company.props.active).toBe(false);
    });

    it('should update updatedAt timestamp when toggling status', () => {
      // Arrange
      const initialDate = new Date('2024-01-01T00:00:00Z');
      const props = {
        id: 'timestamp-test-id',
        name: 'Timestamp Test',
        fantasyName: 'Timestamp',
        document: '00365466000190',
        ie: '778899000122',
        zipCode: '00000-111',
        street: 'Timestamp Street',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Timestamp District',
        city: 'Timestamp City',
        state: 'TS',
        phone01: '1188889999',
        phone02: null,
        cellphone: null,
        email01: 'timestamp@test.com',
        email02: null,
        active: true,
        createdAt: initialDate,
        updatedAt: initialDate,
      };

      const company = Company.load(props);
      const beforeToggle = new Date();

      // Act
      company.toggleStatus();

      // Assert
      const afterToggle = new Date();
      expect(company.props.updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
      expect(company.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeToggle.getTime());
      expect(company.props.updatedAt.getTime()).toBeLessThanOrEqual(afterToggle.getTime());
    });
  });

  describe('props getter', () => {
    it('should return a copy of props (immutability)', () => {
      // Arrange
      const company = Company.create(validProps);

      // Act
      const props1 = company.props;
      const props2 = company.props;

      // Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2); // Different object references
    });

    it('should not allow external mutation of props', () => {
      // Arrange
      const company = Company.create(validProps);
      const originalName = company.props.name;

      // Act
      const props = company.props;
      (props as any).name = 'Modified Name';

      // Assert
      expect(company.props.name).toBe(originalName);
      expect(company.props.name).not.toBe('Modified Name');
    });
  });
});
