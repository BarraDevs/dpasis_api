import { InvalidCommissionError } from 'src/app/seller/domain/errors/invalid-commission.error';
import { AppException } from 'src/core/filters/app.exception';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { Service, ServiceCreateProps, ServiceProps } from './service.entity';

describe('Service Entity', () => {
  const mockCreateProps: ServiceCreateProps = {
    name: 'Manutenção Preventiva',
    nickname: 'Manutenção',
    companyId: 'company-id-123',
    categoryId: 'service-category-id-123',
    productIds: ['product-id-1', 'product-id-2'],
    deadline: '5 dias úteis',
    shippingValueInCents: 1500,
    warrant: '90 dias',
    weight: 'até 10kg',
    maxVolume: 'até 0.5m³',
    dimensions: '50x40x30',
    commission: 12.5,
    valueInCents: 25000,
    description: 'Serviço de manutenção preventiva',
  };

  const mockLoadProps: ServiceProps = {
    id: 'service-id-123',
    active: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-15T10:30:00Z'),
    ...mockCreateProps,
  };

  describe('create', () => {
    it('should create a service with valid props', () => {
      // Act
      const service = Service.create(mockCreateProps);

      // Assert
      expect(service).toBeInstanceOf(Service);
      expect(service.props.id).toBeDefined();
      expect(service.props.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(service.props.active).toBe(true);
    });

    it('should set createdAt and updatedAt', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const service = Service.create(mockCreateProps);

      // Assert
      const afterCreate = new Date();
      expect(service.props.createdAt).toBeInstanceOf(Date);
      expect(service.props.updatedAt).toBeInstanceOf(Date);
      expect(service.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(service.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(service.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(service.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should copy productIds array on create', () => {
      // Arrange
      const productIds = ['product-id-1', 'product-id-2'];
      const propsWithProducts = { ...mockCreateProps, productIds };

      // Act
      const service = Service.create(propsWithProducts);
      productIds.push('product-id-3');

      // Assert
      expect(service.props.productIds).toHaveLength(2);
      expect(service.props.productIds).not.toContain('product-id-3');
    });

    it('should throw InvalidCommissionError when commission is invalid', () => {
      // Arrange
      const invalidProps = { ...mockCreateProps, commission: 120 };

      // Act & Assert
      expect(() => Service.create(invalidProps)).toThrow(InvalidCommissionError);
    });

    it('should require exactly two productIds', () => {
      // Arrange
      const invalidProps = { ...mockCreateProps, productIds: ['product-id-1'] };

      // Act & Assert
      expect(() => Service.create(invalidProps)).toThrow(AppException);
    });

    it('should allow valueInCents to be zero', () => {
      // Arrange
      const propsWithZero = { ...mockCreateProps, valueInCents: 0 };

      // Act
      const service = Service.create(propsWithZero);

      // Assert
      expect(service.props.valueInCents).toBe(0);
    });

    it('should throw when valueInCents is negative', () => {
      // Arrange
      const invalidProps = { ...mockCreateProps, valueInCents: -1 };

      // Act & Assert
      expect(() => Service.create(invalidProps)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw when shippingValueInCents is negative', () => {
      // Arrange
      const invalidProps = { ...mockCreateProps, shippingValueInCents: -1 };

      // Act & Assert
      expect(() => Service.create(invalidProps)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should allow shippingValueInCents to be zero', () => {
      // Arrange
      const propsWithZeroShipping = { ...mockCreateProps, shippingValueInCents: 0 };

      // Act
      const service = Service.create(propsWithZeroShipping);

      // Assert
      expect(service.props.shippingValueInCents).toBe(0);
    });
  });

  describe('load', () => {
    it('should load service with existing props', () => {
      // Act
      const service = Service.load(mockLoadProps);

      // Assert
      expect(service).toBeInstanceOf(Service);
      expect(service.props.id).toBe(mockLoadProps.id);
      expect(service.props.active).toBe(true);
      expect(service.props.createdAt).toEqual(mockLoadProps.createdAt);
      expect(service.props.updatedAt).toEqual(mockLoadProps.updatedAt);
    });

    it('should load service with null optional fields', () => {
      // Arrange
      const propsWithNulls: ServiceProps = {
        ...mockLoadProps,
        nickname: null,
        deadline: null,
        shippingValueInCents: null,
        warrant: null,
        weight: null,
        maxVolume: null,
        dimensions: null,
        description: null,
      };

      // Act
      const service = Service.load(propsWithNulls);

      // Assert
      expect(service.props.nickname).toBeNull();
      expect(service.props.deadline).toBeNull();
      expect(service.props.shippingValueInCents).toBeNull();
      expect(service.props.warrant).toBeNull();
      expect(service.props.weight).toBeNull();
      expect(service.props.maxVolume).toBeNull();
      expect(service.props.dimensions).toBeNull();
      expect(service.props.description).toBeNull();
    });

    it('should throw InvalidCommissionError when loading with invalid commission', () => {
      // Arrange
      const invalidProps: ServiceProps = { ...mockLoadProps, commission: -1 };

      // Act & Assert
      expect(() => Service.load(invalidProps)).toThrow(InvalidCommissionError);
    });

    it('should throw when loading with invalid productIds length', () => {
      // Arrange
      const invalidProps: ServiceProps = {
        ...mockLoadProps,
        productIds: ['product-id-1', 'product-id-2', 'product-id-3'],
      };

      // Act & Assert
      expect(() => Service.load(invalidProps)).toThrow(AppException);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle active status', () => {
      // Arrange
      const service = Service.load(mockLoadProps);

      // Act
      service.toggleStatus();

      // Assert
      expect(service.props.active).toBe(false);

      // Act
      service.toggleStatus();

      // Assert
      expect(service.props.active).toBe(true);
    });
  });

  describe('isActive', () => {
    it('should return true when service is active', () => {
      // Arrange
      const service = Service.load(mockLoadProps);

      // Act
      const result = service.isActive();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when service is inactive', () => {
      // Arrange
      const service = Service.load({ ...mockLoadProps, active: false });

      // Act
      const result = service.isActive();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('props getter', () => {
    it('should not allow mutation of productIds array', () => {
      // Arrange
      const service = Service.create(mockCreateProps);

      // Act
      const props = service.props;
      props.productIds.push('product-id-3');

      // Assert
      expect(service.props.productIds).toHaveLength(2);
      expect(service.props.productIds).not.toContain('product-id-3');
    });
  });
});
