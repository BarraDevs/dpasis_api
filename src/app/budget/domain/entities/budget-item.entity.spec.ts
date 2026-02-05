import { BudgetItemType } from '../../enums/budget-item-type.enum';
import { InvalidItemTypeError } from '../errors/invalid-item-type.error';
import { ItemMustHaveProductOrServiceError } from '../errors/item-must-have-product-or-service.error';
import { BudgetItem, BudgetItemCreateProps, BudgetItemProps } from './budget-item.entity';

describe('BudgetItem Entity', () => {
  const validProductItemProps: BudgetItemCreateProps = {
    itemType: BudgetItemType.PRODUCT,
    productId: 'product-id-123',
    serviceId: null,
    description: 'Laptop Dell Inspiron 15',
    quantity: 2,
    unitPriceInCents: 250000,
    discountInCents: 10000,
  };

  const validServiceItemProps: BudgetItemCreateProps = {
    itemType: BudgetItemType.SERVICE,
    productId: null,
    serviceId: 'service-id-123',
    description: 'Instalação de Software',
    quantity: 1,
    unitPriceInCents: 50000,
    discountInCents: 0,
  };

  describe('create', () => {
    it('should create a PRODUCT item with valid props', () => {
      // Act
      const item = BudgetItem.create(validProductItemProps);

      // Assert
      expect(item).toBeInstanceOf(BudgetItem);
      expect(item.props).toEqual<BudgetItemProps>({
        id: item.props.id,
        itemType: BudgetItemType.PRODUCT,
        productId: validProductItemProps.productId,
        serviceId: validProductItemProps.serviceId,
        description: validProductItemProps.description,
        quantity: validProductItemProps.quantity,
        unitPriceInCents: validProductItemProps.unitPriceInCents,
        discountInCents: validProductItemProps.discountInCents,
        subtotalInCents: item.props.subtotalInCents,
        createdAt: item.props.createdAt,
        updatedAt: item.props.updatedAt,
      });
    });

    it('should create a SERVICE item with valid props', () => {
      // Act
      const item = BudgetItem.create(validServiceItemProps);

      // Assert
      expect(item).toBeInstanceOf(BudgetItem);
      expect(item.props).toEqual<BudgetItemProps>({
        id: item.props.id,
        itemType: BudgetItemType.SERVICE,
        productId: validServiceItemProps.productId,
        serviceId: validServiceItemProps.serviceId,
        description: validServiceItemProps.description,
        quantity: validServiceItemProps.quantity,
        unitPriceInCents: validServiceItemProps.unitPriceInCents,
        discountInCents: validServiceItemProps.discountInCents,
        subtotalInCents: item.props.subtotalInCents,
        createdAt: item.props.createdAt,
        updatedAt: item.props.updatedAt,
      });
    });

    it('should calculate subtotal correctly (quantity * unitPrice) - discount', () => {
      // Act
      const item = BudgetItem.create(validProductItemProps);

      // Assert
      const expectedSubtotal = 2 * 250000 - 10000; // 490000
      expect(item.props.subtotalInCents).toBe(expectedSubtotal);
    });

    it('should calculate subtotal with zero discount', () => {
      // Arrange
      const props: BudgetItemCreateProps = {
        ...validProductItemProps,
        quantity: 3,
        unitPriceInCents: 100000,
        discountInCents: 0,
      };

      // Act
      const item = BudgetItem.create(props);

      // Assert
      expect(item.props.subtotalInCents).toBe(300000);
    });

    it('should create item with timestamps', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const item = BudgetItem.create(validProductItemProps);

      // Assert
      const afterCreate = new Date();
      expect(item.props.createdAt).toBeInstanceOf(Date);
      expect(item.props.updatedAt).toBeInstanceOf(Date);
      expect(item.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(item.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should throw error when itemType is invalid', () => {
      // Arrange
      const invalidProps = {
        ...validProductItemProps,
        itemType: 'INVALID' as any,
      };

      // Act & Assert
      expect(() => BudgetItem.create(invalidProps)).toThrow(InvalidItemTypeError);
    });

    it('should throw error when PRODUCT item has no productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: null,
        serviceId: null,
      };

      // Act & Assert
      expect(() => BudgetItem.create(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when PRODUCT item has no productId but has serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: null,
        serviceId: 'service-id',
      };

      // Act & Assert
      expect(() => BudgetItem.create(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when PRODUCT item has both productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: 'product-id',
        serviceId: 'service-id',
      };

      // Act & Assert
      expect(() => BudgetItem.create(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has no productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validServiceItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: null,
        serviceId: null,
      };

      // Act & Assert
      expect(() => BudgetItem.create(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has productId but no serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validServiceItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: 'product-id',
        serviceId: null,
      };

      // Act & Assert
      expect(() => BudgetItem.create(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has both productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validServiceItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: 'product-id',
        serviceId: 'service-id',
      };

      // Act & Assert
      expect(() => BudgetItem.create(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });
  });

  describe('load', () => {
    let validProductItemProps: BudgetItemProps;

    beforeEach(() => {
      validProductItemProps = {
        id: 'item-id-123',
        itemType: BudgetItemType.PRODUCT,
        productId: 'product-id-123',
        serviceId: null,
        description: 'Existing Product',
        quantity: 5,
        unitPriceInCents: 100000,
        discountInCents: 5000,
        subtotalInCents: 495000,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        updatedAt: new Date('2026-01-15T10:00:00Z'),
      };
    });

    it('should load item with existing props', () => {
      // Act
      const item = BudgetItem.load(validProductItemProps);

      // Assert
      expect(item).toBeInstanceOf(BudgetItem);
      expect(item.props).toEqual(validProductItemProps);
    });

    it('should throw error when loading item with invalid type', () => {
      // Act & Assert
      expect(() => BudgetItem.load({ ...validProductItemProps, itemType: 'INVALID' as any })).toThrow(InvalidItemTypeError);
    });

    it('should throw error when PRODUCT item has no productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: null,
        serviceId: null,
      };

      // Act & Assert
      expect(() => BudgetItem.load(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when PRODUCT item has no productId but has serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: null,
        serviceId: 'service-id',
      };

      // Act & Assert
      expect(() => BudgetItem.load(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when PRODUCT item has both productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: 'product-id',
        serviceId: 'service-id',
      };

      // Act & Assert
      expect(() => BudgetItem.load(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has no productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: null,
        serviceId: null,
      };

      // Act & Assert
      expect(() => BudgetItem.load(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has productId but no serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: 'product-id',
        serviceId: null,
      };

      // Act & Assert
      expect(() => BudgetItem.load(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has both productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: 'product-id',
        serviceId: 'service-id',
      };

      // Act & Assert
      expect(() => BudgetItem.load(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });
  });

  describe('update', () => {
    it('should update item quantity', async() => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // simulate some time passing
      await new Promise((r) => setTimeout(r, 10));

      // Act
      const updatedItem = item.update({ quantity: 5 });

      // Assert
      expect(updatedItem.props).toEqual<BudgetItemProps>({
        ...item.props,
        quantity: 5,
        subtotalInCents: updatedItem.props.subtotalInCents,
        updatedAt: updatedItem.props.updatedAt,
      });
      expect(updatedItem.props.updatedAt.getTime()).toBeGreaterThan(item.props.updatedAt.getTime());
    });

    it('should recalculate subtotal when updating quantity', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // Act
      const updatedItem = item.update({ quantity: 10 });

      // Assert
      const expectedSubtotal = 10 * validProductItemProps.unitPriceInCents - validProductItemProps.discountInCents;
      expect(updatedItem.props.subtotalInCents).toBe(expectedSubtotal);
    });

    it('should recalculate subtotal when updating unitPrice', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // Act
      const updatedItem = item.update({ unitPriceInCents: 300000 });

      // Assert
      const expectedSubtotal = validProductItemProps.quantity * 300000 - validProductItemProps.discountInCents;
      expect(updatedItem.props.subtotalInCents).toBe(expectedSubtotal);
    });

    it('should recalculate subtotal when updating discount', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // Act
      const updatedItem = item.update({ discountInCents: 20000 });

      // Assert
      const expectedSubtotal = validProductItemProps.quantity * validProductItemProps.unitPriceInCents - 20000;
      expect(updatedItem.props.subtotalInCents).toBe(expectedSubtotal);
    });

    it('should update multiple fields at once', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // Act
      const updatedItem = item.update({
        quantity: 3,
        unitPriceInCents: 200000,
        discountInCents: 15000,
      });

      // Assert
      expect(updatedItem.props.quantity).toBe(3);
      expect(updatedItem.props.unitPriceInCents).toBe(200000);
      expect(updatedItem.props.discountInCents).toBe(15000);
      const expectedSubtotal = 3 * 200000 - 15000;
      expect(updatedItem.props.subtotalInCents).toBe(expectedSubtotal);
    });

    it('should throw error when updating to invalid item type', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update({ itemType: 'INVALID' as any })).toThrow(InvalidItemTypeError);
    });

    it('should throw error when updating PRODUCT to have no productId', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update({ productId: null })).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when itemType is invalid', () => {
      // Arrange
      const invalidProps = {
        ...validProductItemProps,
        itemType: 'INVALID' as any,
      };
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update(invalidProps)).toThrow(InvalidItemTypeError);
    });

    it('should throw error when PRODUCT item has no productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: null,
        serviceId: null,
      };
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when PRODUCT item has no productId but has serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: null,
        serviceId: 'service-id',
      };
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when PRODUCT item has both productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: 'product-id',
        serviceId: 'service-id',
      };
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has no productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validServiceItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: null,
        serviceId: null,
      };
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has productId but no serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validServiceItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: 'product-id',
        serviceId: null,
      };
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });

    it('should throw error when SERVICE item has both productId and serviceId', () => {
      // Arrange
      const invalidProps: BudgetItemCreateProps = {
        ...validServiceItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: 'product-id',
        serviceId: 'service-id',
      };
      const item = BudgetItem.create(validProductItemProps);

      // Act & Assert
      expect(() => item.update(invalidProps)).toThrow(ItemMustHaveProductOrServiceError);
    });
  });

  describe('props getter', () => {
    it('should return readonly copy of props', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);

      // Act
      const props1 = item.props;
      const props2 = item.props;

      // Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2);
    });

    it('should not allow external modification of props', () => {
      // Arrange
      const item = BudgetItem.create(validProductItemProps);
      const originalDescription = item.props.description;

      // Act
      const props = item.props as any;
      props.description = 'Modified Description';

      // Assert
      expect(item.props.description).toBe(originalDescription);
      expect(item.props.description).not.toBe('Modified Description');
    });
  });

  describe('isProduct', () => {
    it('should return true if type is PRODUCT', () => {
      // Arrange
      const item = BudgetItem.create({
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: 'product-id-123',
        serviceId: null,
      });

      // Assert
      expect(item.isProduct()).toBe(true);
    });

    it('should return false if type is SERVICE', () => {
      // Arrange
      const item = BudgetItem.create({
        ...validProductItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: null,
        serviceId: 'service-id-123',
      });

      // Assert
      expect(item.isProduct()).toBe(false);
    });
  });

  describe('isService', () => {
    it('should return true if type is SERVICE', () => {
      // Arrange
      const item = BudgetItem.create({
        ...validServiceItemProps,
        itemType: BudgetItemType.SERVICE,
        productId: null,
        serviceId: 'service-id-123',
      });

      // Assert
      expect(item.isService()).toBe(true);
    });

    it('should return false if type is PRODUCT', () => {
      // Arrange
      const item = BudgetItem.create({
        ...validProductItemProps,
        itemType: BudgetItemType.PRODUCT,
        productId: 'product-id-123',
        serviceId: null,
      });

      // Assert
      expect(item.isService()).toBe(false);
    });
  });
});
