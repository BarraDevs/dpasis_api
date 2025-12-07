import { Item } from './item.entity';

describe('Item Entity', () => {
  describe('create method', () => {
    it('should create a new item with valid properties', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-123',
        description: 'Test Item Description',
        serviceCode: 'SKU-001',
        quantity: 5,
        unitPriceInCents: 10000,
      };

      // Act
      const item = Item.create(createProps);

      // Assert
      expect(item).toBeInstanceOf(Item);
      expect(item.props.id).toBeDefined();
      expect(item.props.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4 pattern
      expect(item.props.ownerId).toBe('owner-123');
      expect(item.props.description).toBe('Test Item Description');
      expect(item.props.serviceCode).toBe('SKU-001');
      expect(item.props.quantity).toBe(5);
      expect(item.props.unitPriceInCents).toBe(10000);
      expect(item.props.createdAt).toBeInstanceOf(Date);
      expect(item.props.updatedAt).toBeInstanceOf(Date);
      expect(item.props.createdAt.getTime()).toBeLessThanOrEqual(item.props.updatedAt.getTime());
    });

    it('should create item with minimum valid values', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-456',
        description: 'Minimum Item',
        serviceCode: 'MIN-001',
        quantity: 1, // Minimum quantity
        unitPriceInCents: 0, // Minimum price (free)
      };

      // Act
      const item = Item.create(createProps);

      // Assert
      expect(item.props.quantity).toBe(1);
      expect(item.props.unitPriceInCents).toBe(0);
      expect(item.props.description).toBe('Minimum Item');
      expect(item.props.serviceCode).toBe('MIN-001');
    });

    it('should create item with large values', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-789',
        description: 'Expensive Item with High Quantity',
        serviceCode: 'EXP-001',
        quantity: 999, // High quantity
        unitPriceInCents: 999999, // High price
      };

      // Act
      const item = Item.create(createProps);

      // Assert
      expect(item.props.quantity).toBe(999);
      expect(item.props.unitPriceInCents).toBe(999999);
      expect(item.props.description).toBe('Expensive Item with High Quantity');
    });

    it('should create item with special characters in text fields', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-special',
        description: 'Item with special chars: ãçñü & symbols @#$%',
        serviceCode: 'SP-CHAR-001',
        quantity: 1,
        unitPriceInCents: 2500,
      };

      // Act
      const item = Item.create(createProps);

      // Assert
      expect(item.props.description).toBe('Item with special chars: ãçñü & symbols @#$%');
      expect(item.props.serviceCode).toBe('SP-CHAR-001');
    });

    it('should generate unique IDs for different items', () => {
      // Arrange
      const createProps1 = {
        ownerId: 'owner-1',
        description: 'Item 1',
        serviceCode: 'SKU-001',
        quantity: 1,
        unitPriceInCents: 1000,
      };

      const createProps2 = {
        ownerId: 'owner-2',
        description: 'Item 2',
        serviceCode: 'SKU-002',
        quantity: 2,
        unitPriceInCents: 2000,
      };

      // Act
      const item1 = Item.create(createProps1);
      const item2 = Item.create(createProps2);

      // Assert
      expect(item1.props.id).not.toBe(item2.props.id);
      expect(item1.props.id).toBeDefined();
      expect(item2.props.id).toBeDefined();
    });

    it('should set createdAt and updatedAt to current time', () => {
      // Arrange
      const beforeCreation = new Date();
      const createProps = {
        ownerId: 'owner-time',
        description: 'Time Test Item',
        serviceCode: 'TIME-001',
        quantity: 1,
        unitPriceInCents: 1000,
      };

      // Act
      const item = Item.create(createProps);
      const afterCreation = new Date();

      // Assert
      expect(item.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(item.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(item.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(item.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should throw error when quantity is negative', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-invalid',
        description: 'Invalid Item',
        serviceCode: 'INV-002',
        quantity: -5, // Invalid negative quantity
        unitPriceInCents: 1000,
      };

      // Act & Assert
      expect(() => Item.create(createProps)).toThrow();
    });

    it('should throw error when unitPriceInCents is negative', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-invalid',
        description: 'Invalid Item',
        serviceCode: 'INV-003',
        quantity: 1,
        unitPriceInCents: -1000, // Invalid negative price
      };

      // Act & Assert
      expect(() => Item.create(createProps)).toThrow();
    });

    it('should throw error with descriptive message for invalid quantity', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-invalid',
        description: 'Invalid Item',
        serviceCode: 'INV-004',
        quantity: -1,
        unitPriceInCents: 1000,
      };

      // Act & Assert
      expect(() => Item.create(createProps)).toThrow(/Quantidade/);
    });

    it('should throw error with descriptive message for invalid price', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-invalid',
        description: 'Invalid Item',
        serviceCode: 'INV-005',
        quantity: 1,
        unitPriceInCents: -500,
      };

      // Act & Assert
      expect(() => Item.create(createProps)).toThrow(/Preço unitário/);
    });
  });

  describe('load method', () => {
    it('should load an existing item with all properties', () => {
      // Arrange
      const existingProps = {
        id: 'existing-item-id-123',
        ownerId: 'owner-load',
        description: 'Loaded Item Description',
        serviceCode: 'LOAD-001',
        quantity: 3,
        unitPriceInCents: 7500,
        createdAt: new Date('2023-01-15T10:30:00Z'),
        updatedAt: new Date('2023-01-16T14:45:00Z'),
      };

      // Act
      const item = Item.load(existingProps);

      // Assert
      expect(item).toBeInstanceOf(Item);
      expect(item.props.id).toBe('existing-item-id-123');
      expect(item.props.ownerId).toBe('owner-load');
      expect(item.props.description).toBe('Loaded Item Description');
      expect(item.props.serviceCode).toBe('LOAD-001');
      expect(item.props.quantity).toBe(3);
      expect(item.props.unitPriceInCents).toBe(7500);
      expect(item.props.createdAt).toEqual(new Date('2023-01-15T10:30:00Z'));
      expect(item.props.updatedAt).toEqual(new Date('2023-01-16T14:45:00Z'));
    });

    it('should load item with zero price (free item)', () => {
      // Arrange
      const existingProps = {
        id: 'free-item-id',
        ownerId: 'owner-free',
        description: 'Free Item',
        serviceCode: 'FREE-001',
        quantity: 1,
        unitPriceInCents: 0,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
      };

      // Act
      const item = Item.load(existingProps);

      // Assert
      expect(item.props.unitPriceInCents).toBe(0);
      expect(item.props.quantity).toBe(1);
    });

    it('should load item with large values', () => {
      // Arrange
      const existingProps = {
        id: 'large-item-id',
        ownerId: 'owner-large',
        description: 'Large Value Item',
        serviceCode: 'LARGE-001',
        quantity: 999,
        unitPriceInCents: 999999,
        createdAt: new Date('2023-06-15T12:00:00Z'),
        updatedAt: new Date('2023-06-15T13:00:00Z'),
      };

      // Act
      const item = Item.load(existingProps);

      // Assert
      expect(item.props.quantity).toBe(999);
      expect(item.props.unitPriceInCents).toBe(999999);
    });

    it('should load item with special characters', () => {
      // Arrange
      const existingProps = {
        id: 'special-item-id',
        ownerId: 'owner-special',
        description: 'Item with ãçñü & symbols @#$%',
        serviceCode: 'SPECIAL-001',
        quantity: 2,
        unitPriceInCents: 3000,
        createdAt: new Date('2023-03-10T08:15:00Z'),
        updatedAt: new Date('2023-03-10T09:20:00Z'),
      };

      // Act
      const item = Item.load(existingProps);

      // Assert
      expect(item.props.description).toBe('Item with ãçñü & symbols @#$%');
      expect(item.props.serviceCode).toBe('SPECIAL-001');
    });

    it('should preserve exact timestamps when loading', () => {
      // Arrange
      const specificCreatedAt = new Date('2023-05-20T14:30:45.123Z');
      const specificUpdatedAt = new Date('2023-05-21T16:45:30.456Z');

      const existingProps = {
        id: 'timestamp-item-id',
        ownerId: 'owner-timestamp',
        description: 'Timestamp Test Item',
        serviceCode: 'TIME-001',
        quantity: 1,
        unitPriceInCents: 5000,
        createdAt: specificCreatedAt,
        updatedAt: specificUpdatedAt,
      };

      // Act
      const item = Item.load(existingProps);

      // Assert
      expect(item.props.createdAt).toEqual(specificCreatedAt);
      expect(item.props.updatedAt).toEqual(specificUpdatedAt);
      expect(item.props.createdAt.getTime()).toBe(specificCreatedAt.getTime());
      expect(item.props.updatedAt.getTime()).toBe(specificUpdatedAt.getTime());
    });
  });

  describe('props getter', () => {
    it('should return readonly copy of all properties', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-props',
        description: 'Props Test Item',
        serviceCode: 'PROPS-001',
        quantity: 4,
        unitPriceInCents: 8000,
      };

      // Act
      const item = Item.create(createProps);
      const props = item.props;

      // Assert
      expect(props).toEqual(expect.objectContaining({
        id: expect.any(String),
        ownerId: 'owner-props',
        description: 'Props Test Item',
        serviceCode: 'PROPS-001',
        quantity: 4,
        unitPriceInCents: 8000,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
    });

    it('should return a copy of properties (not reference)', () => {
      // Arrange
      const item = Item.create({
        ownerId: 'owner-copy',
        description: 'Copy Test Item',
        serviceCode: 'COPY-001',
        quantity: 1,
        unitPriceInCents: 1000,
      });

      // Act
      const props1 = item.props;
      const props2 = item.props;

      // Assert
      expect(props1).not.toBe(props2); // Different object references
      expect(props1).toEqual(props2); // Same content
    });

    it('should include id in props from private _id field', () => {
      // Arrange
      const loadProps = {
        id: 'specific-id-123',
        ownerId: 'owner-id-test',
        description: 'ID Test Item',
        serviceCode: 'ID-001',
        quantity: 1,
        unitPriceInCents: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const item = Item.load(loadProps);

      // Assert
      expect(item.props.id).toBe('specific-id-123');
    });
  });

  describe('calculateSubtotal method', () => {
    it('should calculate correct subtotal for single item', () => {
      // Arrange
      const item = Item.create({
        ownerId: 'owner-calc',
        description: 'Calculation Test Item',
        serviceCode: 'CALC-001',
        quantity: 1,
        unitPriceInCents: 10000, // R$ 100.00
      });

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(10000); // 1 * 10000 = 10000
    });

    it('should calculate correct subtotal for multiple items', () => {
      // Arrange
      const item = Item.create({
        ownerId: 'owner-calc-multi',
        description: 'Multi Calculation Test',
        serviceCode: 'CALC-002',
        quantity: 5,
        unitPriceInCents: 2500, // R$ 25.00 each
      });

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(12500); // 5 * 2500 = 12500 (R$ 125.00)
    });

    it('should calculate subtotal for free item (zero price)', () => {
      // Arrange
      const item = Item.create({
        ownerId: 'owner-free-calc',
        description: 'Free Item Calculation',
        serviceCode: 'FREE-CALC-001',
        quantity: 10,
        unitPriceInCents: 0, // Free item
      });

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(0); // 10 * 0 = 0
    });

    it('should calculate subtotal for expensive items', () => {
      // Arrange
      const item = Item.create({
        ownerId: 'owner-expensive',
        description: 'Expensive Item Calculation',
        serviceCode: 'EXP-CALC-001',
        quantity: 100,
        unitPriceInCents: 99999, // R$ 999.99 each
      });

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(9999900); // 100 * 99999 = 9,999,900 (R$ 99,999.00)
    });

    it('should calculate subtotal with decimal-like precision in cents', () => {
      // Arrange
      const item = Item.create({
        ownerId: 'owner-precision',
        description: 'Precision Test Item',
        serviceCode: 'PREC-001',
        quantity: 3,
        unitPriceInCents: 1234, // R$ 12.34 each
      });

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(3702); // 3 * 1234 = 3702 (R$ 37.02)
    });

    it('should calculate subtotal for large quantities and prices', () => {
      // Arrange
      const item = Item.create({
        ownerId: 'owner-large-calc',
        description: 'Large Calculation Test',
        serviceCode: 'LARGE-CALC-001',
        quantity: 999,
        unitPriceInCents: 50000, // R$ 500.00 each
      });

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(49950000); // 999 * 50000 = 49,950,000 (R$ 499,500.00)
    });

    it('should maintain calculation accuracy with loaded items', () => {
      // Arrange
      const item = Item.load({
        id: 'loaded-calc-item',
        ownerId: 'owner-loaded-calc',
        description: 'Loaded Item Calculation',
        serviceCode: 'LOADED-CALC-001',
        quantity: 7,
        unitPriceInCents: 1550, // R$ 15.50 each
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const subtotal = item.calculateSubtotal();

      // Assert
      expect(subtotal).toBe(10850); // 7 * 1550 = 10850 (R$ 108.50)
    });
  });

  describe('Item Entity - Edge Cases', () => {
    it('should handle items with very long descriptions', () => {
      // Arrange
      const longDescription = 'A'.repeat(1000); // Very long description
      const createProps = {
        ownerId: 'owner-long-desc',
        description: longDescription,
        serviceCode: 'LONG-DESC-001',
        quantity: 1,
        unitPriceInCents: 1000,
      };

      // Act
      const item = Item.create(createProps);

      // Assert
      expect(item.props.description).toBe(longDescription);
      expect(item.props.description.length).toBe(1000);
    });

    it('should handle items with very long service codes', () => {
      // Arrange
      const longServiceCode = 'SERVICE-CODE-' + 'X'.repeat(100);
      const createProps = {
        ownerId: 'owner-long-code',
        description: 'Long Service Code Test',
        serviceCode: longServiceCode,
        quantity: 1,
        unitPriceInCents: 1000,
      };

      // Act
      const item = Item.create(createProps);

      // Assert
      expect(item.props.serviceCode).toBe(longServiceCode);
    });

    it('should handle concurrent item creation', () => {
      // Arrange & Act
      const items = Array.from({ length: 10 }, (_, i) =>
        Item.create({
          ownerId: `owner-concurrent-${i}`,
          description: `Concurrent Item ${i}`,
          serviceCode: `CONC-${i.toString().padStart(3, '0')}`,
          quantity: i + 1,
          unitPriceInCents: (i + 1) * 1000,
        })
      );

      // Assert
      const ids = items.map(item => item.props.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10); // All IDs should be unique

      items.forEach((item, index) => {
        expect(item.props.ownerId).toBe(`owner-concurrent-${index}`);
        expect(item.props.description).toBe(`Concurrent Item ${index}`);
        expect(item.props.quantity).toBe(index + 1);
        expect(item.props.unitPriceInCents).toBe((index + 1) * 1000);
      });
    });
  });

  describe('invariant protection', () => {
    it('should ensure _props contains only valid entity properties without additional data', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-123',
        description: 'Test Item Description',
        serviceCode: 'SKU-001',
        quantity: 5,
        unitPriceInCents: 10000,
      };

      // Act
      const item = Item.create(createProps);

      // Assert - Verify _props has exactly the expected keys
      const expectedKeys = [
        'id',
        'ownerId',
        'description',
        'serviceCode',
        'quantity',
        'unitPriceInCents',
        'createdAt',
        'updatedAt',
      ].sort();

      const actualKeys = Object.keys(item.props).sort();

      expect(actualKeys).toEqual(expectedKeys);
      expect(actualKeys.length).toBe(expectedKeys.length);
    });

    it('should not allow additional properties to leak into _props when using create', () => {
      // Arrange
      const propsWithExtra = {
        ownerId: 'owner-123',
        description: 'Test Item',
        serviceCode: 'SKU-001',
        quantity: 5,
        unitPriceInCents: 10000,
        extraProperty: 'should not exist',
        anotherExtra: 123,
        maliciousData: { dangerous: true },
      } as any;

      // Act
      const item = Item.create(propsWithExtra);

      // Assert
      expect(item.props).not.toHaveProperty('extraProperty');
      expect(item.props).not.toHaveProperty('anotherExtra');
      expect(item.props).not.toHaveProperty('maliciousData');
    });

    it('should not allow additional properties to leak into _props when using load', () => {
      // Arrange
      const propsWithExtra = {
        id: 'existing-item-id',
        ownerId: 'owner-456',
        description: 'Loaded Item',
        serviceCode: 'LOAD-001',
        quantity: 3,
        unitPriceInCents: 5000,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        maliciousProperty: 'compromising invariant',
        injectedField: { attack: 'vector' },
        unauthorizedData: 'leaked',
      } as any;

      // Act
      const item = Item.load(propsWithExtra);

      // Assert
      expect(item.props).not.toHaveProperty('maliciousProperty');
      expect(item.props).not.toHaveProperty('injectedField');
      expect(item.props).not.toHaveProperty('unauthorizedData');
    });

    it('should maintain exact property count after operations', () => {
      // Arrange
      const createProps = {
        ownerId: 'owner-789',
        description: 'Operation Test Item',
        serviceCode: 'OPS-001',
        quantity: 2,
        unitPriceInCents: 3000,
      };

      const item = Item.create(createProps);
      const initialKeyCount = Object.keys(item.props).length;

      // Act - Perform operations
      const subtotal1 = item.calculateSubtotal();
      const subtotal2 = item.calculateSubtotal();

      // Assert
      const finalKeyCount = Object.keys(item.props).length;
      expect(finalKeyCount).toBe(initialKeyCount);
      expect(finalKeyCount).toBe(8); // Exact number of expected properties
      expect(subtotal1).toBe(subtotal2); // Ensure calculations don't affect props
    });

    it('should ensure props getter returns consistent data structure', () => {
      // Arrange
      const loadProps = {
        id: 'consistent-id',
        ownerId: 'owner-consistent',
        description: 'Consistency Test',
        serviceCode: 'CONS-001',
        quantity: 5,
        unitPriceInCents: 7500,
        createdAt: new Date('2024-06-15T10:00:00Z'),
        updatedAt: new Date('2024-06-20T15:30:00Z'),
      };

      // Act
      const item = Item.load(loadProps);
      const props1 = item.props;
      const props2 = item.props;

      // Assert
      expect(Object.keys(props1).length).toBe(Object.keys(props2).length);
      expect(Object.keys(props1).sort()).toEqual(Object.keys(props2).sort());
      expect(props1.id).toBe(props2.id);
      expect(props1.ownerId).toBe(props2.ownerId);
      expect(props1.description).toBe(props2.description);
    });
  });
});
