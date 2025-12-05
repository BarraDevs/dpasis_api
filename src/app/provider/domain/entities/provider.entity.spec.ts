import { InvalidCnpjError } from 'src/shared/value-objects/cnpj/cnpj.error';
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
      expect(() => Provider.load(props as any)).toThrow(InvalidProviderTypeError);
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
});


