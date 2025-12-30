import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { Item } from './item.entity';

describe('Item Entity', () => {
  const validCreateProps = {
    ownerId: 'owner-id-123',
    description: 'Desenvolvimento de Software',
    serviceCode: 'SRV-001',
    quantity: 10,
    unitPriceInCents: 15000,
  };

  const validLoadProps = {
    id: 'item-id-123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-15T10:30:00Z'),
    ...validCreateProps,
  };

  describe('create', () => {
    it('should create an item with valid props', () => {
      // Act
      const item = Item.create(validCreateProps);

      // Assert
      expect(item).toBeInstanceOf(Item);
      expect(item.props.id).toBeDefined();
      expect(item.props.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create an item with createdAt timestamp', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const item = Item.create(validCreateProps);

      // Assert
      const afterCreate = new Date();
      expect(item.props.createdAt).toBeInstanceOf(Date);
      expect(item.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(item.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create an item with updatedAt timestamp', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const item = Item.create(validCreateProps);

      // Assert
      const afterCreate = new Date();
      expect(item.props.updatedAt).toBeInstanceOf(Date);
      expect(item.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(item.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create an item with all required properties', () => {
      // Act
      const item = Item.create(validCreateProps);

      // Assert
      expect(item.props.ownerId).toBe(validCreateProps.ownerId);
      expect(item.props.description).toBe(validCreateProps.description);
      expect(item.props.serviceCode).toBe(validCreateProps.serviceCode);
      expect(item.props.quantity).toBe(validCreateProps.quantity);
      expect(item.props.unitPriceInCents).toBe(validCreateProps.unitPriceInCents);
    });

    it('should throw error when quantity is zero', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 0,
      };

      // Act & Assert
      expect(() => Item.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => Item.create(props)).toThrow('Quantidade deve ser um número inteiro positivo');
    });

    it('should throw error when quantity is negative', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: -5,
      };

      // Act & Assert
      expect(() => Item.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => Item.create(props)).toThrow('Quantidade deve ser um número inteiro positivo');
    });

    it('should throw error when quantity is a decimal number', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 10.5,
      };

      // Act & Assert
      expect(() => Item.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => Item.create(props)).toThrow('Quantidade deve ser um número inteiro positivo');
    });

    it('should accept zero as unitPriceInCents', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        unitPriceInCents: 0,
      };

      // Act
      const item = Item.create(props);

      // Assert
      expect(item.props.unitPriceInCents).toBe(0);
    });

    it('should throw error when unitPriceInCents is negative', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        unitPriceInCents: -1000,
      };

      // Act & Assert
      expect(() => Item.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => Item.create(props)).toThrow('Preço unitário deve ser um número inteiro positivo');
    });

    it('should throw error when unitPriceInCents is a decimal number', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        unitPriceInCents: 150.75,
      };

      // Act & Assert
      expect(() => Item.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => Item.create(props)).toThrow('Preço unitário deve ser um número inteiro positivo');
    });

    it('should create item with minimum valid quantity (1)', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 1,
      };

      // Act
      const item = Item.create(props);

      // Assert
      expect(item.props.quantity).toBe(1);
    });

    it('should create item with large quantity', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 1000,
      };

      // Act
      const item = Item.create(props);

      // Assert
      expect(item.props.quantity).toBe(1000);
    });

    it('should create item with large unitPriceInCents', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        unitPriceInCents: 99999999,
      };

      // Act
      const item = Item.create(props);

      // Assert
      expect(item.props.unitPriceInCents).toBe(99999999);
    });
  });

  describe('load', () => {
    it('should load an item with valid props', () => {
      // Act
      const item = Item.load(validLoadProps);

      // Assert
      expect(item).toBeInstanceOf(Item);
      expect(item.props.id).toBe(validLoadProps.id);
      expect(item.props.ownerId).toBe(validLoadProps.ownerId);
      expect(item.props.description).toBe(validLoadProps.description);
      expect(item.props.serviceCode).toBe(validLoadProps.serviceCode);
      expect(item.props.quantity).toBe(validLoadProps.quantity);
      expect(item.props.unitPriceInCents).toBe(validLoadProps.unitPriceInCents);
      expect(item.props.createdAt).toEqual(validLoadProps.createdAt);
      expect(item.props.updatedAt).toEqual(validLoadProps.updatedAt);
    });

    it('should throw error when loading item with negative quantity', () => {
      // Arrange
      const props = {
        ...validLoadProps,
        quantity: -1,
      };

      // Act & Assert
      expect(() => Item.load(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw error when loading item with zero quantity', () => {
      // Arrange
      const props = {
        ...validLoadProps,
        quantity: 0,
      };

      // Act & Assert
      expect(() => Item.load(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw error when loading item with invalid unitPriceInCents', () => {
      // Arrange
      const props = {
        ...validLoadProps,
        unitPriceInCents: -100,
      };

      // Act & Assert
      expect(() => Item.load(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should load item with zero unitPriceInCents', () => {
      // Arrange
      const props = {
        ...validLoadProps,
        unitPriceInCents: 0,
      };

      // Act
      const item = Item.load(props);

      // Assert
      expect(item.props.unitPriceInCents).toBe(0);
    });
  });

  describe('props', () => {
    it('should return a copy of props (immutability)', () => {
      // Arrange
      const item = Item.create(validCreateProps);

      // Act
      const props1 = item.props;
      const props2 = item.props;

      // Assert
      expect(props1).not.toBe(props2); // Different references
      expect(props1).toEqual(props2); // Same values
    });

    it('should not allow mutation of returned props', () => {
      // Arrange
      const item = Item.create(validCreateProps);
      const props = item.props;

      // Act
      const originalOwnerId = props.ownerId;
      (props as any).ownerId = 'modified-owner-id';

      // Assert
      expect(item.props.ownerId).toBe(originalOwnerId); // Original value preserved
      expect(item.props.ownerId).not.toBe('modified-owner-id');
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 10,
        unitPriceInCents: 15000,
      };
      const item = Item.create(props);

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(150000); // 10 * 15000
    });

    it('should calculate subtotal with quantity 1', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 1,
        unitPriceInCents: 25000,
      };
      const item = Item.create(props);

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(25000); // 1 * 25000
    });

    it('should calculate subtotal with zero price', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 5,
        unitPriceInCents: 0,
      };
      const item = Item.create(props);

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(0); // 5 * 0
    });

    it('should calculate subtotal with large values', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 100,
        unitPriceInCents: 999999,
      };
      const item = Item.create(props);

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(99999900); // 100 * 999999
    });

    it('should return integer subtotal', () => {
      // Arrange
      const props = {
        ...validCreateProps,
        quantity: 3,
        unitPriceInCents: 10000,
      };
      const item = Item.create(props);

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(Number.isInteger(subtotal)).toBe(true);
      expect(subtotal).toBe(30000);
    });
  });

  describe('edge cases', () => {
    it('should handle different service descriptions', () => {
      // Arrange
      const descriptions = [
        'Desenvolvimento de Software',
        'Consultoria em TI',
        'Manutenção de Equipamentos',
        'Treinamento',
      ];

      descriptions.forEach((description) => {
        // Act
        const item = Item.create({
          ...validCreateProps,
          description,
        });

        // Assert
        expect(item.props.description).toBe(description);
      });
    });

    it('should handle different service codes', () => {
      // Arrange
      const serviceCodes = [
        'SRV-001',
        'CODE-ABC',
        '123456',
        'SERVICE-XYZ-2024',
      ];

      serviceCodes.forEach((serviceCode) => {
        // Act
        const item = Item.create({
          ...validCreateProps,
          serviceCode,
        });

        // Assert
        expect(item.props.serviceCode).toBe(serviceCode);
      });
    });

    it('should handle different owner IDs', () => {
      // Arrange
      const ownerIds = [
        'owner-id-1',
        'owner-id-2',
        'different-owner-123',
        'uuid-format-owner',
      ];

      ownerIds.forEach((ownerId) => {
        // Act
        const item = Item.create({
          ...validCreateProps,
          ownerId,
        });

        // Assert
        expect(item.props.ownerId).toBe(ownerId);
      });
    });
  });
});
