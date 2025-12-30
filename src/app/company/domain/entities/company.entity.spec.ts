import { InvalidCnpjError } from 'src/shared/value-objects/cnpj/cnpj.error';
import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
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

    it('should load an existing company with all properties', () => {
      // Act
      const company = Company.load(existingProps);

      // Assert
      expect(company).toBeInstanceOf(Company);
      expect(company.props).toMatchObject(existingProps);
    });

    it('should load company with active=false', () => {
      // Act
      const company = Company.load({ ...existingProps, active: false });

      // Assert
      expect(company.props.active).toBe(false);
    });

    it('should load company with null optional fields', () => {
      // Arrange
      const props = {
        ...existingProps,
        complement: null,
        reference: null,
        phone02: null,
        cellphone: null,
        email02: null,
        active: true,
      };

      // Act
      const company = Company.load(props);

      // Assert
      expect(company.props.complement).toBeNull();
      expect(company.props.reference).toBeNull();
      expect(company.props.phone02).toBeNull();
      expect(company.props.cellphone).toBeNull();
      expect(company.props.email02).toBeNull();
    });

    it('should sanitize document if loaded with formatting', () => {
      // Act
      const company = Company.load({ ...existingProps, document: '55.967.002/0001-46' });

      // Assert
      expect(company.props.document).toBe('55967002000146');
    });

    it('should sanitize phones if loaded with formatting', () => {
      // Arrange
      const props = {
        ...existingProps,
        phone01: '(11) 5555-6666', // With formatting
        phone02: '(11) 7777-8888', // With formatting
        cellphone: '(11) 99999-0000', // With formatting
      };

      // Act
      const company = Company.load(props);

      // Assert
      expect(company.props.phone01).toBe('1155556666');
      expect(company.props.phone02).toBe('1177778888');
      expect(company.props.cellphone).toBe('11999990000');
    });

    it('should validate and accept valid emails when loading', () => {
      // Arrange
      const props = {
        ...existingProps,
        email01: 'valid.email@domain.com',
        email02: 'another.valid@domain.com.br',
      };

      // Act
      const company = Company.load(props);

      // Assert
      expect(company.props.email01).toBe('valid.email@domain.com');
      expect(company.props.email02).toBe('another.valid@domain.com.br');
    });

    it('should throw InvalidCnpjError when loading with invalid document', () => {
      // Act & Assert
      expect(() => Company.load({ ...existingProps, document: '28492891000161' })).toThrow(InvalidCnpjError);
    });

    it('should throw InvalidEmailError when loading with invalid email01', () => {
      // Act & Assert
      expect(() => Company.load({ ...existingProps, email01: 'not-an-email' })).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError when loading with invalid email02', () => {
      // Act & Assert
      expect(() => Company.load({ ...existingProps, email02: 'invalid@' })).toThrow(InvalidEmailError);
    });

    it('should throw InvalidPhoneError when loading with invalid phone01', () => {
      // Act & Assert
      expect(() => Company.load({ ...existingProps, phone01: '123' })).toThrow(InvalidPhoneError);
    });

    it('should throw InvalidPhoneError when loading with invalid phone02', () => {
      // Act & Assert
      expect(() => Company.load({ ...existingProps, phone02: 'abc123defg' })).toThrow(InvalidPhoneError);
    });

    it('should throw InvalidPhoneError when loading with invalid cellphone', () => {
      // Act & Assert
      expect(() => Company.load({ ...existingProps, cellphone: '11 9' })).toThrow(InvalidPhoneError);
    });

    it('should preserve original timestamps when loading', () => {
      // Arrange
      const createdAt = new Date('2024-01-01T12:00:00Z');
      const updatedAt = new Date('2024-06-15T18:30:00Z');

      // Act
      const company = Company.load({ ...existingProps, createdAt, updatedAt });

      // Assert
      expect(company.props.createdAt).toStrictEqual(createdAt);
      expect(company.props.updatedAt).toStrictEqual(updatedAt);
      expect(company.props.createdAt.getTime()).toBe(createdAt.getTime());
      expect(company.props.updatedAt.getTime()).toBe(updatedAt.getTime());
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

  describe('invariant protection', () => {
    it('should ensure _props contains only valid entity properties without additional data', () => {
      // Arrange
      const props = {
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

      // Act
      const company = Company.create(props);

      // Assert - Verify _props has exactly the expected keys
      const expectedKeys = [
        'id',
        'name',
        'fantasyName',
        'document',
        'ie',
        'zipCode',
        'street',
        'number',
        'complement',
        'reference',
        'neighborhood',
        'city',
        'state',
        'phone01',
        'phone02',
        'cellphone',
        'email01',
        'email02',
        'active',
        'createdAt',
        'updatedAt',
      ].sort();

      const actualKeys = Object.keys(company.props).sort();

      expect(actualKeys).toEqual(expectedKeys);
      expect(actualKeys.length).toBe(expectedKeys.length);
    });

    it('should not allow additional properties to leak into _props when using create', () => {
      // Arrange
      const propsWithExtra = {
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
        extraProperty: 'should not exist',
        anotherExtra: 123,
      } as any;

      // Act
      const company = Company.create(propsWithExtra);

      // Assert
      expect(company.props).not.toHaveProperty('extraProperty');
      expect(company.props).not.toHaveProperty('anotherExtra');
    });

    it('should not allow additional properties to leak into _props when using load', () => {
      // Arrange
      const propsWithExtra = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Existing Company Ltda',
        fantasyName: 'Existing Company',
        document: '55967002000146',
        ie: '987.654.321.098',
        zipCode: '54321-876',
        street: 'Rua Existing',
        number: '500',
        complement: 'Andar 5',
        reference: 'Ao lado do banco',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        phone01: '2122223333',
        phone02: '2144445555',
        cellphone: '21987654321',
        email01: 'existing@company.com',
        email02: 'contact@company.com',
        active: true,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-20T14:45:00Z'),
        maliciousProperty: 'compromising invariant',
      } as any;

      // Act
      const company = Company.load(propsWithExtra);

      // Assert
      expect(company.props).not.toHaveProperty('maliciousProperty');
      expect(company.props).not.toHaveProperty('dangerous');
    });

    it('should maintain exact property count after operations', () => {
      // Arrange
      const props = {
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

      const company = Company.create(props);
      const initialKeyCount = Object.keys(company.props).length;

      // Act
      company.toggleStatus();
      company.toggleStatus();

      // Assert
      const finalKeyCount = Object.keys(company.props).length;
      expect(finalKeyCount).toBe(initialKeyCount);
      expect(finalKeyCount).toBe(21); // Exact number of expected properties
    });
  });
});
