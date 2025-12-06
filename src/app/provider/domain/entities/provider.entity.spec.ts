import { InvalidCnpjError } from 'src/shared/value-objects/cnpj/cnpj.error';
import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { ProviderType } from '../enums/provider-type.enum';
import { InvalidProviderTypeError } from '../errors/invalid-provider-type.error';
import { Provider } from './provider.entity';

describe('ProviderEntity', () => {
  const baseProps = {
    name: 'Provider Name',
    valueInCents: 10000,
    cnpj: '11222333000181',
    ie: '123456789',
    companyName: 'Provider Company',
    zipCode: '12345678',
    street: 'Main Street',
    number: '100',
    complement: null,
    reference: null,
    neighborhood: 'Downtown',
    city: 'São Paulo',
    state: 'SP',
    email: 'provider@email.com',
    website: 'https://provider.com',
    companyIds: ['company-id-1', 'company-id-2'],
  };

  describe('create', () => {
    it('should create a Provider with RECURRING type and paymentDay', () => {
      // Arrange
      const props = {
        ...baseProps,
        type: ProviderType.RECURRING,
        paymentDay: 15,
        paymentExpirationDate: new Date('2025-12-31'),
      };

      // Act
      const provider = Provider.create(props);

      // Assert
      expect(provider.props).toMatchObject({
        ...props,
        id: expect.any(String),
        active: true,
        paymentDay: 15,
        paymentExpirationDate: null, // Should be null because type is RECURRING
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create a Provider with ONE_TIME type and paymentExpirationDate', () => {
      // Arrange
      const expirationDate = new Date('2025-12-31');
      const props = {
        ...baseProps,
        type: ProviderType.ONE_TIME,
        paymentDay: 15,
        paymentExpirationDate: expirationDate,
      };

      // Act
      const provider = Provider.create(props);

      // Assert
      expect(provider.props).toMatchObject({
        ...props,
        id: expect.any(String),
        active: true,
        paymentDay: null, // Should be null because type is ONE_TIME
        paymentExpirationDate: expirationDate,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw an error for invalid CNPJ', () => {
      // Arrange
      const props = {
        ...baseProps,
        type: ProviderType.RECURRING,
        paymentDay: 15,
        paymentExpirationDate: null,
        cnpj: 'invalid-cnpj',
      };

      // Act & Assert
      expect(() => Provider.create(props)).toThrow(InvalidCnpjError);
    });

    it('should throw an error for invalid provider type when creating', () => {
      // Arrange
      const props = {
        ...baseProps,
        type: 'INVALID_TYPE',
        paymentDay: 10,
        paymentExpirationDate: null,
      };

      // Act & Assert
      expect(() => Provider.create(props as any)).toThrow(InvalidProviderTypeError);
    });

    it('should throw an error for invalid email when creating', () => {
      // Arrange
      const props = {
        ...baseProps,
        type: ProviderType.RECURRING,
        paymentDay: 15,
        paymentExpirationDate: null,
        email: 'invalid-email',
      };

      // Act & Assert
      expect(() => Provider.create(props)).toThrow(InvalidEmailError);
    });

    it('should throw an error for empty email when creating', () => {
      // Arrange
      const props = {
        ...baseProps,
        type: ProviderType.ONE_TIME,
        paymentDay: null,
        paymentExpirationDate: new Date('2025-12-31'),
        email: '',
      };

      // Act & Assert
      expect(() => Provider.create(props)).toThrow(InvalidEmailError);
    });

    it('should throw an error for email without @ when creating', () => {
      // Arrange
      const props = {
        ...baseProps,
        type: ProviderType.RECURRING,
        paymentDay: 10,
        paymentExpirationDate: null,
        email: 'notanemail.com',
      };

      // Act & Assert
      expect(() => Provider.create(props)).toThrow(InvalidEmailError);
    });

    it('should throw an error for email without domain when creating', () => {
      // Arrange
      const props = {
        ...baseProps,
        type: ProviderType.ONE_TIME,
        paymentDay: null,
        paymentExpirationDate: new Date('2025-12-31'),
        email: 'user@',
      };

      // Act & Assert
      expect(() => Provider.create(props)).toThrow(InvalidEmailError);
    });

    it('should accept valid email formats when creating', () => {
      // Arrange
      const validEmails = [
        'provider@company.com',
        'contact@provider.com.br',
        'user.name@provider.co',
        'test_email@provider-company.org',
      ];

      validEmails.forEach((email) => {
        const props = {
          ...baseProps,
          type: ProviderType.RECURRING,
          paymentDay: 15,
          paymentExpirationDate: null,
          email,
        };

        // Act
        const provider = Provider.create(props);

        // Assert
        expect(provider.props.email).toBe(email);
      });
    });
  });

  describe('load', () => {
    it('should load a Provider with given properties', () => {
      // Arrange
      const props = {
        id: 'unique-provider-id',
        name: 'Loaded Provider',
        type: ProviderType.RECURRING,
        valueInCents: 20000,
        cnpj: '25029388000184',
        ie: '987654321',
        paymentDay: 10,
        paymentExpirationDate: null,
        companyName: 'Loaded Company',
        zipCode: '87654321',
        street: 'Loaded Street',
        number: '200',
        complement: 'Suite 100',
        reference: 'Near the park',
        neighborhood: 'Uptown',
        city: 'Rio de Janeiro',
        state: 'RJ',
        email: 'loaded@email.com',
        website: null,
        active: false,
        companyIds: ['company-id-3'],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };

      // Act
      const provider = Provider.load(props);

      // Assert
      expect(provider.props).toEqual(props);
    });

    it('should throw an error for invalid CNPJ when loading', () => {
      // Arrange
      const props = {
        id: 'unique-provider-id',
        name: 'Loaded Provider',
        type: ProviderType.RECURRING,
        valueInCents: 20000,
        cnpj: 'invalid-cnpj',
        ie: '987654321',
        paymentDay: 10,
        paymentExpirationDate: null,
        companyName: 'Loaded Company',
        zipCode: '87654321',
        street: 'Loaded Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Uptown',
        city: 'Rio de Janeiro',
        state: 'RJ',
        email: 'loaded@email.com',
        website: null,
        active: false,
        companyIds: ['company-id-3'],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Provider.load(props)).toThrow(InvalidCnpjError);
    });

    it('should throw an error for invalid provider type when loading', () => {
      // Arrange
      const props = {
        id: 'unique-provider-id',
        name: 'Loaded Provider',
        type: 'INVALID_TYPE',
        valueInCents: 20000,
        cnpj: '22333444000105',
        ie: '987654321',
        paymentDay: 10,
        paymentExpirationDate: null,
        companyName: 'Loaded Company',
        zipCode: '87654321',
        street: 'Loaded Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Uptown',
        city: 'Rio de Janeiro',
        state: 'RJ',
        email: 'loaded@email.com',
        website: null,
        active: false,
        companyIds: ['company-id-3'],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Provider.load(props)).toThrow(InvalidProviderTypeError);
    });

    it('should throw an error for invalid email when loading', () => {
      // Arrange
      const props = {
        id: 'provider-with-invalid-email',
        name: 'Email Test Provider',
        type: ProviderType.RECURRING,
        valueInCents: 15000,
        cnpj: '11222333000181',
        ie: 'EMAIL123',
        paymentDay: 5,
        paymentExpirationDate: null,
        companyName: 'Email Test Company',
        zipCode: '99999999',
        street: 'Email St',
        number: '999',
        complement: null,
        reference: null,
        neighborhood: 'Email District',
        city: 'São Paulo',
        state: 'SP',
        email: 'not-a-valid-email',
        website: null,
        active: true,
        companyIds: ['comp-1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => Provider.load(props)).toThrow(InvalidEmailError);
    });

    it('should throw an error for malformed email when loading', () => {
      // Arrange
      const props = {
        id: 'provider-malformed-email',
        name: 'Malformed Email Provider',
        type: ProviderType.ONE_TIME,
        valueInCents: 18000,
        cnpj: '11222333000181',
        ie: 'MAL456',
        paymentDay: null,
        paymentExpirationDate: new Date('2025-12-31'),
        companyName: 'Malformed Company',
        zipCode: '88888888',
        street: 'Malformed St',
        number: '888',
        complement: null,
        reference: null,
        neighborhood: 'Malformed Area',
        city: 'Rio de Janeiro',
        state: 'RJ',
        email: '@nodomain.com',
        website: 'https://malformed.com',
        active: true,
        companyIds: ['comp-2'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => Provider.load(props)).toThrow(InvalidEmailError);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle the provider status', () => {
      // Arrange
      const props = {
        id: 'unique-provider-id',
        name: 'Toggle Provider',
        type: ProviderType.ONE_TIME,
        valueInCents: 15000,
        cnpj: '25029388000184',
        ie: '111222333',
        paymentDay: null,
        paymentExpirationDate: new Date('2025-06-30'),
        companyName: 'Toggle Company',
        zipCode: '11223344',
        street: 'Toggle Street',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Midtown',
        city: 'Curitiba',
        state: 'PR',
        email: 'toggle@email.com',
        website: 'https://toggle.com',
        active: false,
        companyIds: ['company-id-4'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const provider = Provider.load(props);

      // Act & Assert
      expect(provider.props.active).toBe(false);

      provider.toggleStatus();
      expect(provider.props.active).toBe(true);

      provider.toggleStatus();
      expect(provider.props.active).toBe(false);
    });
  });

  describe('invariant protection', () => {
    it('should ensure _props contains only valid entity properties without additional data', () => {
      // Arrange
      const createProps = {
        name: 'Invariant Test Provider',
        type: ProviderType.RECURRING,
        valueInCents: 50000,
        cnpj: '11222333000181',
        ie: 'INV123456',
        paymentDay: 10,
        paymentExpirationDate: null,
        companyName: 'Invariant Company',
        zipCode: '11111111',
        street: 'Invariant St',
        number: '999',
        complement: 'Suite 1',
        reference: 'Near park',
        neighborhood: 'Center',
        city: 'São Paulo',
        state: 'SP',
        email: 'invariant@test.com',
        website: 'https://invariant.com',
        companyIds: ['comp-1', 'comp-2'],
      };

      // Act
      const provider = Provider.create(createProps);

      // Assert - Verify _props has exactly the expected keys
      const expectedKeys = [
        'id',
        'name',
        'type',
        'valueInCents',
        'cnpj',
        'ie',
        'paymentDay',
        'paymentExpirationDate',
        'companyName',
        'zipCode',
        'street',
        'number',
        'complement',
        'reference',
        'neighborhood',
        'city',
        'state',
        'email',
        'website',
        'companyIds',
        'active',
        'createdAt',
        'updatedAt',
      ].sort();

      const actualKeys = Object.keys(provider.props).sort();

      expect(actualKeys).toEqual(expectedKeys);
      expect(actualKeys.length).toBe(expectedKeys.length);
    });

    it('should not allow additional properties to leak into _props when using create', () => {
      // Arrange
      const propsWithExtra = {
        name: 'Extra Props Test',
        type: ProviderType.ONE_TIME,
        valueInCents: 20000,
        cnpj: '11222333000181',
        ie: 'EXTRA123',
        paymentDay: null,
        paymentExpirationDate: new Date('2025-12-31'),
        companyName: 'Extra Company',
        zipCode: '22222222',
        street: 'Extra St',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Extra',
        city: 'Rio de Janeiro',
        state: 'RJ',
        email: 'extra@test.com',
        website: null,
        companyIds: ['comp-x'],
        extraProperty: 'should not exist',
        maliciousData: { dangerous: true },
        unauthorizedField: 'leaked data',
      } as any;

      // Act
      const provider = Provider.create(propsWithExtra);

      // Assert
      expect(provider.props).not.toHaveProperty('extraProperty');
      expect(provider.props).not.toHaveProperty('maliciousData');
      expect(provider.props).not.toHaveProperty('unauthorizedField');
    });

    it('should not allow additional properties to leak into _props when using load', () => {
      // Arrange
      const propsWithExtra = {
        id: 'existing-provider-id',
        name: 'Loaded Provider',
        type: ProviderType.RECURRING,
        valueInCents: 30000,
        cnpj: '11222333000181',
        ie: 'LOAD456',
        paymentDay: 5,
        paymentExpirationDate: null,
        companyName: 'Loaded Company',
        zipCode: '33333333',
        street: 'Load St',
        number: '300',
        complement: 'Floor 2',
        reference: 'Next to mall',
        neighborhood: 'Load District',
        city: 'Belo Horizonte',
        state: 'MG',
        email: 'load@test.com',
        website: 'https://load.com',
        companyIds: ['comp-y', 'comp-z'],
        active: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        injectedProperty: 'compromising invariant',
        attackVector: { injection: 'attempt' },
        leakedField: 'unauthorized',
      } as any;

      // Act
      const provider = Provider.load(propsWithExtra);

      // Assert
      expect(provider.props).not.toHaveProperty('injectedProperty');
      expect(provider.props).not.toHaveProperty('attackVector');
      expect(provider.props).not.toHaveProperty('leakedField');
    });

    it('should maintain exact property count after operations', () => {
      // Arrange
      const createProps = {
        name: 'Operation Test Provider',
        type: ProviderType.RECURRING,
        valueInCents: 15000,
        cnpj: '11222333000181',
        ie: 'OPS789',
        paymentDay: 20,
        paymentExpirationDate: null,
        companyName: 'Operations Company',
        zipCode: '44444444',
        street: 'Ops St',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'Operations',
        city: 'Brasília',
        state: 'DF',
        email: 'ops@test.com',
        website: 'https://ops.com',
        companyIds: ['comp-ops'],
      };

      const provider = Provider.create(createProps);
      const initialKeyCount = Object.keys(provider.props).length;

      // Act - Perform operations
      provider.toggleStatus();
      provider.toggleStatus();
      provider.toggleStatus();
      const props1 = provider.props;
      const props2 = provider.props;

      // Assert
      const finalKeyCount = Object.keys(provider.props).length;
      expect(finalKeyCount).toBe(initialKeyCount);
      expect(finalKeyCount).toBe(23); // Exact number of expected properties
      expect(props1.active).toBe(props2.active); // Ensure consistency
    });

    it('should ensure props getter returns consistent data structure', () => {
      // Arrange
      const loadProps = {
        id: 'consistent-provider-id',
        name: 'Consistency Provider',
        type: ProviderType.ONE_TIME,
        valueInCents: 25000,
        cnpj: '11222333000181',
        ie: 'CONS999',
        paymentDay: null,
        paymentExpirationDate: new Date('2025-06-30'),
        companyName: 'Consistency Corp',
        zipCode: '55555555',
        street: 'Consistent Ave',
        number: '500',
        complement: 'Building A',
        reference: 'Corner location',
        neighborhood: 'Consistent Area',
        city: 'Fortaleza',
        state: 'CE',
        email: 'consistent@test.com',
        website: 'https://consistent.com',
        companyIds: ['comp-a', 'comp-b', 'comp-c'],
        active: false,
        createdAt: new Date('2024-06-15T10:00:00Z'),
        updatedAt: new Date('2024-06-20T15:30:00Z'),
      };

      // Act
      const provider = Provider.load(loadProps);
      const props1 = provider.props;
      const props2 = provider.props;

      // Assert
      expect(Object.keys(props1).length).toBe(Object.keys(props2).length);
      expect(Object.keys(props1).sort()).toEqual(Object.keys(props2).sort());
      expect(props1.id).toBe(props2.id);
      expect(props1.name).toBe(props2.name);
      expect(props1.type).toBe(props2.type);
      expect(props1.cnpj).toBe(props2.cnpj);
    });

    it('should ensure companyIds array is properly copied and isolated', () => {
      // Arrange
      const createProps = {
        name: 'Array Test Provider',
        type: ProviderType.RECURRING,
        valueInCents: 18000,
        cnpj: '11222333000181',
        ie: 'ARR123',
        paymentDay: 25,
        paymentExpirationDate: null,
        companyName: 'Array Company',
        zipCode: '66666666',
        street: 'Array St',
        number: '600',
        complement: null,
        reference: null,
        neighborhood: 'Array District',
        city: 'Salvador',
        state: 'BA',
        email: 'array@test.com',
        website: null,
        companyIds: ['comp-1', 'comp-2'],
      };

      // Act
      const provider = Provider.create(createProps);
      const companyIds1 = provider.props.companyIds;
      const companyIds2 = provider.props.companyIds;

      // Assert - Arrays should be different references (copies)
      expect(companyIds1).toEqual(companyIds2);
      expect(companyIds1).not.toBe(companyIds2);

      // Mutating returned array should not affect internal state
      companyIds1.push('new-company');
      expect(provider.props.companyIds).toEqual(['comp-1', 'comp-2']);
      expect(provider.props.companyIds.length).toBe(2);
    });
  });
});
