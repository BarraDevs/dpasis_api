import { Product } from 'src/app/product/domain/entities/product.entity';
import { AppException } from 'src/core/filters/app.exception';
import { ProductStockMovementTypeEnum } from '../enums/product-stock-movement.enum';
import { InsufficientStockError } from '../errors/insufficient-stock.error';
import { QuantityMustBePositiveError } from '../errors/quantity-must-be-positive.error';
import { ValueMustBePositiveError } from '../errors/value-must-be-positive.error';
import { ProductStockMovement } from './product-stock-movement.entity';

describe('ProductStockMovement Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = Product.create({
      companyId: 'company-123',
      type: 'MERCHANDISE',
      group01: 'Group 1',
      group02: 'Group 2',
      description: 'Test Product',
      manufacturerCode: 'MFG123',
      brand: 'Test Brand',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: '100',
      minimumStock: 10,
      maximumStock: 1000,
      warrantyDays: 90,
      weightInKg: 1.5,
      heightInCm: 10.0,
      lengthInCm: 20.0,
      widthInCm: 15.0,
      markup: 50,
      marginB: 30,
      currency: 'BRL',
      exchangeRate: 1.0,
      unitCostInCents: 5000,
      unitPriceInCents: 10000,
      ean: '7891234567890',
      images: [],
      supplierIds: [],
    });
  });

  describe('create - INPUT movements and stock updates', () => {
    it('should create INPUT movement and increment stock by exact quantity', () => {
      // Arrange
      const initialStock = product.props.currentStock;

      // Act
      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Assert
      expect(movement.props.quantity).toBe(50);
      expect(updatedProduct.props.currentStock).toBe(initialStock + 50);
      expect(updatedProduct.props.currentStock).toBe(50);
    });

    it('should create INPUT movement starting from zero stock', () => {
      // Arrange
      expect(product.props.currentStock).toBe(0);

      // Act
      const { product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);

      // Assert
      expect(updatedProduct.props.currentStock).toBe(100);
    });

    it('should accumulate multiple INPUT movements correctly', () => {
      // Act - First INPUT
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);
      expect(p1.props.currentStock).toBe(50);

      // Second INPUT
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 30,
        unitPriceInCents: 5200,
      }, p1);
      expect(p2.props.currentStock).toBe(80); // 50 + 30

      // Third INPUT
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 20,
        unitPriceInCents: 4800,
      }, p2);
      expect(p3.props.currentStock).toBe(100); // 80 + 20
    });

    it('should handle INPUT with quantity = 1', () => {
      // Act
      const { product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 1,
        unitPriceInCents: 5000,
      }, product);

      // Assert
      expect(updatedProduct.props.currentStock).toBe(1);
    });

    it('should handle INPUT with very large quantity', () => {
      // Act
      const { product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 999999,
        unitPriceInCents: 5000,
      }, product);

      // Assert
      expect(updatedProduct.props.currentStock).toBe(999999);
    });

    it('should handle INPUT with zero unit cost', () => {
      // Act
      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 0,
      }, product);

      // Assert
      expect(movement.props.unitPriceInCents).toBe(0);
      expect(updatedProduct.props.currentStock).toBe(100);
    });

    it('should update product timestamp on INPUT', () => {
      // Arrange
      const initialUpdatedAt = product.props.updatedAt;

      // Act
      const { product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Assert
      expect(updatedProduct.props.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
    });

    it('should create unique movement ID for each INPUT', () => {
      // Act
      const { movement: m1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      const { movement: m2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 30,
        unitPriceInCents: 5000,
      }, product);

      // Assert
      expect(m1.props.id).toBeDefined();
      expect(m2.props.id).toBeDefined();
      expect(m1.props.id).not.toBe(m2.props.id);
    });

    it('should throw error when INPUT quantity is zero', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 0,
          unitPriceInCents: 5000,
        }, product);
      }).toThrow(QuantityMustBePositiveError);
    });

    it('should throw error when INPUT quantity is negative', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: -10,
          unitPriceInCents: 5000,
        }, product);
      }).toThrow(QuantityMustBePositiveError);
    });

    it('should throw error when INPUT unitValue is negative', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 10,
          unitPriceInCents: -5000,
        }, product);
      }).toThrow(ValueMustBePositiveError);
    });
  });

  describe('create - OUTPUT movements and stock updates', () => {
    beforeEach(() => {
      // Setup initial stock for OUTPUT tests
      const { product: productWithStock } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);
      product = productWithStock;
    });

    it('should create OUTPUT movement and decrement stock by exact quantity', () => {
      // Arrange
      const initialStock = product.props.currentStock;

      // Act
      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 10000,
      }, product);

      // Assert
      expect(movement.props.quantity).toBe(30);
      expect(updatedProduct.props.currentStock).toBe(initialStock - 30);
      expect(updatedProduct.props.currentStock).toBe(70);
    });

    it('should handle OUTPUT with quantity = 1', () => {
      // Act
      const { product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 1,
        unitPriceInCents: 10000,
      }, product);

      // Assert
      expect(updatedProduct.props.currentStock).toBe(99);
    });

    it('should deplete stock to exactly zero', () => {
      // Act
      const { product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 10000,
      }, product);

      // Assert
      expect(updatedProduct.props.currentStock).toBe(0);
    });

    it('should handle multiple sequential OUTPUT movements', () => {
      // Act
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 20,
        unitPriceInCents: 10000,
      }, product);
      expect(p1.props.currentStock).toBe(80); // 100 - 20

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 10500,
      }, p1);
      expect(p2.props.currentStock).toBe(50); // 80 - 30

      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 15,
        unitPriceInCents: 11000,
      }, p2);
      expect(p3.props.currentStock).toBe(35); // 50 - 15
    });

    it('should update product timestamp on OUTPUT', () => {
      // Arrange
      const initialUpdatedAt = product.props.updatedAt;

      // Act
      const { product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 10,
        unitPriceInCents: 10000,
      }, product);

      // Assert
      expect(updatedProduct.props.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
    });

    it('should throw error when product has no stock (currentStock = 0)', () => {
      // Arrange - Deplete stock first
      const { product: emptyProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 10000,
      }, product);

      // Act & Assert
      expect(() => {
        ProductStockMovement.create({
          productId: emptyProduct.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 1,
          unitPriceInCents: 10000,
        }, emptyProduct);
      }).toThrow(InsufficientStockError);
    });

    it('should throw error when trying OUTPUT on product with zero initial stock', () => {
      // Arrange - Create new product with zero stock
      const newProduct = Product.create({
        companyId: 'company-456',
        type: 'MERCHANDISE',
        group01: 'Group 1',
        group02: 'Group 2',
        description: 'Empty Product',
        manufacturerCode: 'MFG789',
        brand: 'Test Brand',
        measureUnit: 'UN',
        ncm: '12345678',
        economicBatch: '100',
        minimumStock: 10,
        maximumStock: 1000,
        warrantyDays: 90,
        weightInKg: 1.5,
        heightInCm: 10.0,
        lengthInCm: 20.0,
        widthInCm: 15.0,
        markup: 50,
        marginB: 30,
        currency: 'BRL',
        exchangeRate: 1.0,
        unitCostInCents: 5000,
        unitPriceInCents: 10000,
        ean: '7891234567890',
        images: [],
        supplierIds: [],
      });

      // Act & Assert
      expect(newProduct.props.currentStock).toBe(0);
      expect(() => {
        ProductStockMovement.create({
          productId: newProduct.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 1,
          unitPriceInCents: 10000,
        }, newProduct);
      }).toThrow(InsufficientStockError);
    });

    it('should throw error when OUTPUT quantity is zero', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 0,
          unitPriceInCents: 10000,
        }, product);
      }).toThrow(QuantityMustBePositiveError);
    });

    it('should throw error when OUTPUT quantity is negative', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: -10,
          unitPriceInCents: 10000,
        }, product);
      }).toThrow(QuantityMustBePositiveError);
    });

    it('should throw error when OUTPUT unitValue is negative', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 10,
          unitPriceInCents: -10000,
        }, product);
      }).toThrow(ValueMustBePositiveError);
    });

    it('should allow OUTPUT with zero sale price', () => {
      // Act
      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 10,
        unitPriceInCents: 0,
      }, product);

      // Assert
      expect(movement.props.unitPriceInCents).toBe(0);
      expect(updatedProduct.props.currentStock).toBe(90);
    });
  });

  describe('Stock update business rules - Mixed movements', () => {
    it('should handle alternating INPUT and OUTPUT correctly', () => {
      // Act & Assert - Starting from 0
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);
      expect(p1.props.currentStock).toBe(100);

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(70);

      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5200,
      }, p2);
      expect(p3.props.currentStock).toBe(120);

      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 40,
        unitPriceInCents: 11000,
      }, p3);
      expect(p4.props.currentStock).toBe(80);
    });

    it('should maintain accurate stock through complex sequence', () => {
      // Arrange
      const operations = [
        { type: ProductStockMovementTypeEnum.INPUT, qty: 50, value: 5000 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 30, value: 5100 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 25, value: 10000 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 45, value: 4900 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 35, value: 10500 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 60, value: 5200 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 40, value: 11000 },
      ];

      let currentProduct = product;
      let expectedStock = 0;

      // Act
      for (const op of operations) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: op.type,
          quantity: op.qty,
          unitPriceInCents: op.value,
        }, currentProduct);

        if (op.type === ProductStockMovementTypeEnum.INPUT) {
          expectedStock += op.qty;
        } else {
          expectedStock -= op.qty;
        }

        expect(p.props.currentStock).toBe(expectedStock);
        currentProduct = p;
      }

      // Assert final state
      expect(currentProduct.props.currentStock).toBe(85); // 50+30-25+45-35+60-40
    });

    it('should handle stock going to zero and back up', () => {
      // Act
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);
      expect(p1.props.currentStock).toBe(50);

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(0);

      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 75,
        unitPriceInCents: 5100,
      }, p2);
      expect(p3.props.currentStock).toBe(75);
    });

    it('should prevent OUTPUT after stock depletion', () => {
      // Arrange - Deplete stock
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      const { product: depleted } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10000,
      }, p1);

      // Act & Assert
      expect(depleted.props.currentStock).toBe(0);
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 1,
          unitPriceInCents: 10000,
        }, depleted);
      }).toThrow(InsufficientStockError);
    });
  });

  describe('Stock calculation accuracy - Stress tests', () => {
    it('should maintain accuracy through 100 movements', () => {
      // Arrange
      let currentProduct = product;
      let expectedStock = 0;

      // Act - 100 movements
      for (let i = 0; i < 100; i++) {
        const isInput = i % 2 === 0;
        const quantity = 10;

        if (isInput) {
          const { product: p } = ProductStockMovement.create({
            productId: product.props.id,
            type: ProductStockMovementTypeEnum.INPUT,
            quantity,
            unitPriceInCents: 5000,
          }, currentProduct);
          expectedStock += quantity;
          currentProduct = p;
        } else {
          const { product: p } = ProductStockMovement.create({
            productId: product.props.id,
            type: ProductStockMovementTypeEnum.OUTPUT,
            quantity,
            unitPriceInCents: 10000,
          }, currentProduct);
          expectedStock -= quantity;
          currentProduct = p;
        }
      }

      // Assert - 50 inputs and 50 outputs of 10 = 0
      expect(currentProduct.props.currentStock).toBe(0);
      expect(currentProduct.props.currentStock).toBe(expectedStock);
    });

    it('should handle accumulation of large quantities', () => {
      // Act
      let currentProduct = product;

      for (let i = 0; i < 10; i++) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 1000,
          unitPriceInCents: 5000,
        }, currentProduct);
        currentProduct = p;
      }

      // Assert
      expect(currentProduct.props.currentStock).toBe(10000);
    });

    it('should handle depletion of large quantities', () => {
      // Arrange - Create large stock
      const { product: largeStock } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 10000,
        unitPriceInCents: 5000,
      }, product);

      // Act - Deplete in chunks
      let currentProduct = largeStock;
      for (let i = 0; i < 10; i++) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 1000,
          unitPriceInCents: 10000,
        }, currentProduct);
        currentProduct = p;
      }

      // Assert
      expect(currentProduct.props.currentStock).toBe(0);
    });

    it('should handle random sequence maintaining accuracy', () => {
      // Arrange
      const randomOps = [
        101, 202, -50, 303, -100, 254, -75, -120, 500, -200, 150,
      ];

      let currentProduct = product;
      let expectedStock = 0;

      // Act
      for (const op of randomOps) {
        if (op > 0) {
          const { product: p } = ProductStockMovement.create({
            productId: product.props.id,
            type: ProductStockMovementTypeEnum.INPUT,
            quantity: op,
            unitPriceInCents: 5000,
          }, currentProduct);
          expectedStock += op;
          currentProduct = p;
        } else {
          const { product: p } = ProductStockMovement.create({
            productId: product.props.id,
            type: ProductStockMovementTypeEnum.OUTPUT,
            quantity: Math.abs(op),
            unitPriceInCents: 10000,
          }, currentProduct);
          expectedStock += op; // op is negative
          currentProduct = p;
        }
      }

      // Assert
      expect(currentProduct.props.currentStock).toBe(965); // Sum of operations
      expect(currentProduct.props.currentStock).toBe(expectedStock);
    });
  });

  describe('Movement entity properties', () => {
    it('should create movement with all required properties', () => {
      // Act
      const { movement } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Assert
      expect(movement.props.id).toBeDefined();
      expect(movement.props.productId).toBe(product.props.id);
      expect(movement.props.type).toBe(ProductStockMovementTypeEnum.INPUT);
      expect(movement.props.quantity).toBe(50);
      expect(movement.props.unitPriceInCents).toBe(5000);
      expect(movement.props.createdAt).toBeInstanceOf(Date);
    });

    it('should assign unique ID to each movement', () => {
      // Act
      const movements = [];
      let currentProduct = product;

      for (let i = 0; i < 50; i++) {
        const { movement, product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 1,
          unitPriceInCents: 5000,
        }, currentProduct);
        movements.push(movement.props.id);
        currentProduct = p;
      }

      // Assert - All IDs should be unique
      const uniqueIds = new Set(movements);
      expect(uniqueIds.size).toBe(50);
    });

    it('should set createdAt to current timestamp', () => {
      // Arrange
      const before = new Date();

      // Act
      const { movement } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      const after = new Date();

      // Assert
      expect(movement.props.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(movement.props.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should maintain immutable props', () => {
      // Arrange
      const { movement } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Act
      const props1 = movement.props;
      const props2 = movement.props;

      // Assert - Should return copies
      expect(props1).not.toBe(props2);
      expect(props1).toEqual(props2);
    });

    it('should prevent mutation of props', () => {
      // Arrange
      const { movement } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Act
      const props = movement.props;
      const originalQuantity = props.quantity;
      (props as any).quantity = 999;

      // Assert - Internal state unchanged
      expect(movement.props.quantity).toBe(originalQuantity);
      expect(movement.props.quantity).toBe(50);
    });
  });

  describe('load - Loading existing movements', () => {
    it('should load INPUT movement from props', () => {
      // Arrange
      const props = {
        id: 'movement-123',
        productId: 'product-456',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
      };

      // Act
      const movement = ProductStockMovement.load(props);

      // Assert
      expect(movement.props).toEqual(props);
      expect(movement.props.id).toBe('movement-123');
      expect(movement.props.type).toBe(ProductStockMovementTypeEnum.INPUT);
      expect(movement.props.quantity).toBe(100);
    });

    it('should load OUTPUT movement from props', () => {
      // Arrange
      const props = {
        id: 'movement-789',
        productId: 'product-456',
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10000,
        createdAt: new Date('2024-01-16T14:20:00.000Z'),
      };

      // Act
      const movement = ProductStockMovement.load(props);

      // Assert
      expect(movement.props.type).toBe(ProductStockMovementTypeEnum.OUTPUT);
      expect(movement.props.quantity).toBe(50);
    });

    it('should preserve all properties when loading', () => {
      // Arrange
      const specificDate = new Date('2024-06-15T08:45:30.123Z');
      const props = {
        id: 'custom-id-abc',
        productId: 'product-xyz',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 777,
        unitPriceInCents: 7777,
        createdAt: specificDate,
      };

      // Act
      const movement = ProductStockMovement.load(props);

      // Assert
      expect(movement.props.id).toBe('custom-id-abc');
      expect(movement.props.productId).toBe('product-xyz');
      expect(movement.props.type).toBe(ProductStockMovementTypeEnum.INPUT);
      expect(movement.props.quantity).toBe(777);
      expect(movement.props.unitPriceInCents).toBe(7777);
      expect(movement.props.createdAt).toEqual(specificDate);
    });
  });

  describe('Validation errors', () => {
    it('should throw error for invalid movement type', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: 'INVALID_TYPE' as any,
          quantity: 10,
          unitPriceInCents: 5000,
        }, product);
      }).toThrow(AppException);

      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: 'INVALID_TYPE' as any,
          quantity: 10,
          unitPriceInCents: 5000,
        }, product);
      }).toThrow('Tipo de movimentação inválido');
    });

    it('should validate quantity before type-specific logic', () => {
      // Quantity validation should happen first
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 0,
          unitPriceInCents: 5000,
        }, product);
      }).toThrow(QuantityMustBePositiveError);
    });

    it('should validate unitValue before type-specific logic', () => {
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 10,
          unitPriceInCents: -100,
        }, product);
      }).toThrow(ValueMustBePositiveError);
    });

    it('should validate all constraints together', () => {
      // Test that all validations work independently
      const testCases = [
        { qty: 0, value: 5000, error: QuantityMustBePositiveError },
        { qty: -10, value: 5000, error: QuantityMustBePositiveError },
        { qty: 10, value: -5000, error: ValueMustBePositiveError },
      ];

      for (const test of testCases) {
        expect(() => {
          ProductStockMovement.create({
            productId: product.props.id,
            type: ProductStockMovementTypeEnum.INPUT,
            quantity: test.qty,
            unitPriceInCents: test.value,
          }, product);
        }).toThrow(test.error);
      }
    });
  });

  describe('Real-world business scenarios', () => {
    it('should simulate purchase cycle', () => {
      // Purchase
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);

      // Verify stock after purchase
      expect(p1.props.currentStock).toBe(100);
    });

    it('should simulate sales cycle', () => {
      // Purchase
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);

      // Sale 1
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 10000,
      }, p1);

      // Sale 2
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 20,
        unitPriceInCents: 10000,
      }, p2);

      // Assert
      expect(p3.props.currentStock).toBe(50); // 100 - 30 - 20
    });

    it('should simulate restock after sales', () => {
      // Initial purchase
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);

      // Sales
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 70,
        unitPriceInCents: 10000,
      }, p1);

      // Restock
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 80,
        unitPriceInCents: 5200,
      }, p2);

      // Assert
      expect(p3.props.currentStock).toBe(110); // 100 - 70 + 80
    });

    it('should simulate inventory adjustment (increase)', () => {
      // Initial stock
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 95,
        unitPriceInCents: 5000,
      }, product);

      // Physical count found 5 more
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 5,
        unitPriceInCents: 5000,
      }, p1);

      // Assert
      expect(p2.props.currentStock).toBe(100);
    });

    it('should simulate inventory adjustment (decrease)', () => {
      // Initial stock
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 105,
        unitPriceInCents: 5000,
      }, product);

      // Physical count found 5 less
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 5,
        unitPriceInCents: 0,
      }, p1);

      // Assert
      expect(p2.props.currentStock).toBe(100);
    });

    it('should simulate return/devolution from customer', () => {
      // Sale
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10000,
      }, p1);

      // Customer returns 5 items
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 5,
        unitPriceInCents: 5000,
      }, p2);

      // Assert
      expect(p3.props.currentStock).toBe(55); // 100 - 50 + 5
    });

    it('should simulate end-of-day operations', () => {
      // Morning delivery
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 200,
        unitPriceInCents: 5000,
      }, product);

      // Sales throughout the day
      const sales = [25, 30, 15, 40, 20];
      let currentProduct = p1;

      for (const qty of sales) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: qty,
          unitPriceInCents: 10000,
        }, currentProduct);
        currentProduct = p;
      }

      // Afternoon delivery
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5100,
      }, currentProduct);

      // More sales
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 35,
        unitPriceInCents: 10000,
      }, p2);

      // Adjustment
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 2,
        unitPriceInCents: 5000,
      }, p3);

      // Assert - 200 - (25+30+15+40+20) + 50 - 35 + 2 = 87
      expect(p4.props.currentStock).toBe(87);
    });

    it('should handle complete product lifecycle', () => {
      // 1. Initial purchase
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);
      expect(p1.props.currentStock).toBe(100);

      // 2. First sales period
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 60,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(40);

      // 3. Restock
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 75,
        unitPriceInCents: 5200,
      }, p2);
      expect(p3.props.currentStock).toBe(115);

      // 4. More sales
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 85,
        unitPriceInCents: 11000,
      }, p3);
      expect(p4.props.currentStock).toBe(30);

      // 5. Final restock
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5100,
      }, p4);
      expect(p5.props.currentStock).toBe(130);

      // 6. Final sales
      const { product: p6 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10500,
      }, p5);
      expect(p6.props.currentStock).toBe(80);
    });
  });

  describe('Edge cases - Stock boundary conditions', () => {
    it('should handle stock remaining at exactly 1 unit', () => {
      // Setup
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 10,
        unitPriceInCents: 5000,
      }, product);

      // Deplete to 1
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 9,
        unitPriceInCents: 10000,
      }, p1);

      expect(p2.props.currentStock).toBe(1);

      // Can still sell the last unit
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 1,
        unitPriceInCents: 10000,
      }, p2);

      expect(p3.props.currentStock).toBe(0);
    });

    it('should handle maximum safe integer quantity', () => {
      const maxSafe = 9007199254740991; // Number.MAX_SAFE_INTEGER

      const { product: updated } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: maxSafe,
        unitPriceInCents: 5000,
      }, product);

      expect(updated.props.currentStock).toBe(maxSafe);
    });

    it('should maintain precision with integer arithmetic', () => {
      // Multiple small operations
      let currentProduct = product;

      for (let i = 0; i < 1000; i++) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 1,
          unitPriceInCents: 5000,
        }, currentProduct);
        currentProduct = p;
      }

      expect(currentProduct.props.currentStock).toBe(1000);
    });
  });

  describe('Product reference and relationship', () => {
    it('should maintain correct productId throughout movements', () => {
      const productId = product.props.id;

      const { movement: m1, product: p1 } = ProductStockMovement.create({
        productId,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      const { movement: m2, product: p2 } = ProductStockMovement.create({
        productId,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 20,
        unitPriceInCents: 10000,
      }, p1);

      expect(m1.props.productId).toBe(productId);
      expect(m2.props.productId).toBe(productId);
      expect(p1.props.id).toBe(productId);
      expect(p2.props.id).toBe(productId);
    });

    it('should create movements for different products independently', () => {
      const product2 = Product.create({
        companyId: 'company-999',
        type: 'MERCHANDISE',
        group01: 'Group A',
        group02: 'Group B',
        description: 'Product 2',
        manufacturerCode: 'MFG999',
        brand: 'Brand 2',
        measureUnit: 'UN',
        ncm: '87654321',
        economicBatch: '50',
        minimumStock: 5,
        maximumStock: 500,
        warrantyDays: 60,
        weightInKg: 2.0,
        heightInCm: 15.0,
        lengthInCm: 25.0,
        widthInCm: 20.0,
        markup: 40,
        marginB: 25,
        currency: 'BRL',
        exchangeRate: 1.0,
        unitCostInCents: 3000,
        unitPriceInCents: 6000,
        ean: '1234567890123',
        images: [],
        supplierIds: [],
      });

      // Movements for product 1
      const { movement: m1, product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, product);

      // Movements for product 2
      const { movement: m2, product: p2 } = ProductStockMovement.create({
        productId: product2.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 3000,
      }, product2);

      // Assert independence
      expect(m1.props.productId).toBe(product.props.id);
      expect(m2.props.productId).toBe(product2.props.id);
      expect(p1.props.currentStock).toBe(100);
      expect(p2.props.currentStock).toBe(50);
      expect(m1.props.id).not.toBe(m2.props.id);
    });
  });

  describe('Complex real-world scenarios with multiple interactions', () => {
    it('should simulate weekly retail operations', () => {
      // Monday - Initial stock
      const { product: mon } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 500,
        unitPriceInCents: 5000,
      }, product);
      expect(mon.props.currentStock).toBe(500);

      // Monday - Sales
      const { product: monEnd } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 45,
        unitPriceInCents: 10000,
      }, mon);
      expect(monEnd.props.currentStock).toBe(455);

      // Tuesday - Sales
      const { product: tue } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 52,
        unitPriceInCents: 10000,
      }, monEnd);
      expect(tue.props.currentStock).toBe(403);

      // Wednesday - Sales + Restock
      const current = tue;
      const { product: wed1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 48,
        unitPriceInCents: 10000,
      }, current);
      expect(wed1.props.currentStock).toBe(355);

      const { product: wed2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 200,
        unitPriceInCents: 5100,
      }, wed1);
      expect(wed2.props.currentStock).toBe(555);

      // Thursday - Higher sales
      const { product: thu } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 67,
        unitPriceInCents: 10000,
      }, wed2);
      expect(thu.props.currentStock).toBe(488);

      // Friday - Peak day
      const { product: fri } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 89,
        unitPriceInCents: 10000,
      }, thu);
      expect(fri.props.currentStock).toBe(399);

      // Weekend - Lower sales
      const { product: weekend } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 34,
        unitPriceInCents: 10000,
      }, fri);

      expect(weekend.props.currentStock).toBe(365);
    });

    it('should simulate Black Friday with high volume operations', () => {
      // Pre-Black Friday stock preparation
      const { product: prep1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 1000,
        unitPriceInCents: 5000,
      }, product);

      const { product: prep2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 500,
        unitPriceInCents: 5000,
      }, prep1);

      expect(prep2.props.currentStock).toBe(1500);

      // Black Friday - Morning rush (6am-12pm)
      let current = prep2;
      const morningSales = [150, 200, 180, 220, 190, 210];

      for (const qty of morningSales) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: qty,
          unitPriceInCents: 8000,
        }, current);
        current = p;
      }

      expect(current.props.currentStock).toBe(350); // 1500 - 1150

      // Emergency restock
      const { product: restock } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 800,
        unitPriceInCents: 5000,
      }, current);
      expect(restock.props.currentStock).toBe(1150);

      // Afternoon rush (12pm-6pm)
      const afternoonSales = [130, 160, 145, 170, 155];
      current = restock;

      for (const qty of afternoonSales) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: qty,
          unitPriceInCents: 8000,
        }, current);
        current = p;
      }

      expect(current.props.currentStock).toBe(390); // 1150 - 760
    });

    it('should handle supplier partial deliveries', () => {
      // Order placed for 1000 units, but arrives in parts

      // First delivery - 300 units
      const { product: del1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 300,
        unitPriceInCents: 5000,
      }, product);
      expect(del1.props.currentStock).toBe(300);

      // Start selling
      const { product: sale1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 80,
        unitPriceInCents: 10000,
      }, del1);
      expect(sale1.props.currentStock).toBe(220);

      // Second delivery - 400 units
      const { product: del2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 400,
        unitPriceInCents: 5000,
      }, sale1);
      expect(del2.props.currentStock).toBe(620);

      // More sales
      const { product: sale2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 150,
        unitPriceInCents: 10000,
      }, del2);
      expect(sale2.props.currentStock).toBe(470);

      // Final delivery - 300 units
      const { product: del3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 300,
        unitPriceInCents: 5000,
      }, sale2);
      expect(del3.props.currentStock).toBe(770);

      // Total delivered should be 1000
      const totalDelivered = 300 + 400 + 300;
      expect(totalDelivered).toBe(1000);
    });

    it('should simulate customer returns and exchanges', () => {
      // Initial stock and sales
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 200,
        unitPriceInCents: 5000,
      }, product);

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(100);

      // Customer returns 5 defective items
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 5,
        unitPriceInCents: 5000,
      }, p2);
      expect(p3.props.currentStock).toBe(105);

      // More sales
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 10000,
      }, p3);
      expect(p4.props.currentStock).toBe(75);

      // Another return - 3 items
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 3,
        unitPriceInCents: 5000,
      }, p4);
      expect(p5.props.currentStock).toBe(78);

      // More returns - 7 items
      const { product: p6 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 7,
        unitPriceInCents: 5000,
      }, p5);
      expect(p6.props.currentStock).toBe(85);

      // Total returns: 5 + 3 + 7 = 15
    });

    it('should handle product with very high turnover (daily operations)', () => {
      // Simulate a fast-moving product over a month
      let current = product;

      // Week 1
      for (let day = 1; day <= 7; day++) {
        // Morning delivery
        const { product: morning } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.INPUT,
          quantity: 100,
          unitPriceInCents: 5000,
        }, current);

        // Sales throughout the day
        const { product: afternoon } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 85,
          unitPriceInCents: 10000,
        }, morning);

        current = afternoon;
      }

      // After week 1: (100 - 85) * 7 = 105
      expect(current.props.currentStock).toBe(105);

      // Week 2-4 (similar pattern)
      for (let week = 0; week < 3; week++) {
        for (let day = 1; day <= 7; day++) {
          const { product: morning } = ProductStockMovement.create({
            productId: product.props.id,
            type: ProductStockMovementTypeEnum.INPUT,
            quantity: 100,
            unitPriceInCents: 5000,
          }, current);

          const { product: afternoon } = ProductStockMovement.create({
            productId: product.props.id,
            type: ProductStockMovementTypeEnum.OUTPUT,
            quantity: 85,
            unitPriceInCents: 10000,
          }, morning);

          current = afternoon;
        }
      }

      // After 4 weeks: 105 + (15 * 21) = 420
      expect(current.props.currentStock).toBe(420);
    });

    it('should simulate seasonal product lifecycle', () => {
      // Season start - Low demand
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 500,
        unitPriceInCents: 5000,
      }, product);

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(450);

      // Mid-season - Peak demand
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 1000,
        unitPriceInCents: 5000,
      }, p2);
      expect(p3.props.currentStock).toBe(1450);

      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 800,
        unitPriceInCents: 10000,
      }, p3);
      expect(p4.props.currentStock).toBe(650);

      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 400,
        unitPriceInCents: 10000,
      }, p4);
      expect(p5.props.currentStock).toBe(250);

      // End of season - Clearance
      const { product: p6 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 200,
        unitPriceInCents: 6000, // Discounted
      }, p5);
      expect(p6.props.currentStock).toBe(50);

      // Final clearance
      const { product: p7 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 4000, // Heavy discount
      }, p6);
      expect(p7.props.currentStock).toBe(0);
    });

    it('should handle losses, damages and write-offs', () => {
      // Initial stock
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 1000,
        unitPriceInCents: 5000,
      }, product);

      // Normal sales
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 300,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(700);

      // Damaged goods - write-off (no revenue)
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 25,
        unitPriceInCents: 0,
      }, p2);
      expect(p3.props.currentStock).toBe(675);

      // More sales
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 200,
        unitPriceInCents: 10000,
      }, p3);
      expect(p4.props.currentStock).toBe(475);

      // Expired/broken items
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 15,
        unitPriceInCents: 0,
      }, p4);
      expect(p5.props.currentStock).toBe(460);

      // Theft/loss
      const { product: p6 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 10,
        unitPriceInCents: 0,
      }, p5);
      expect(p6.props.currentStock).toBe(450);

      // Total losses: 25 + 15 + 10 = 50
    });

    it('should simulate promotional campaign with free samples', () => {
      // Stock for promotion
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 500,
        unitPriceInCents: 5000,
      }, product);

      // Free samples distribution (no revenue)
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 0,
      }, p1);
      expect(p2.props.currentStock).toBe(400);

      // Sales from promotion
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 150,
        unitPriceInCents: 9000, // Promotional price
      }, p2);
      expect(p3.props.currentStock).toBe(250);

      // More free samples
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 0,
      }, p3);
      expect(p4.props.currentStock).toBe(200);

      // Regular sales after promotion
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 10000,
      }, p4);
      expect(p5.props.currentStock).toBe(100);
    });

    it('should handle product discontinuation process', () => {
      // Final stock before discontinuation
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 300,
        unitPriceInCents: 5000,
      }, product);

      // No more purchases - only sales
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(200);

      // Discount sales
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 80,
        unitPriceInCents: 7000,
      }, p2);
      expect(p3.props.currentStock).toBe(120);

      // Deep discount
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 70,
        unitPriceInCents: 5000,
      }, p3);
      expect(p4.props.currentStock).toBe(50);

      // Final clearance - liquidation
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 40,
        unitPriceInCents: 3000,
      }, p4);
      expect(p5.props.currentStock).toBe(10);

      // Donation/disposal of remaining
      const { product: p6 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 10,
        unitPriceInCents: 0,
      }, p5);
      expect(p6.props.currentStock).toBe(0);
    });

    it('should simulate warehouse transfer operations', () => {
      // Main warehouse receives shipment
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 1000,
        unitPriceInCents: 5000,
      }, product);

      // Transfer to Store 1 (output from main)
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 200,
        unitPriceInCents: 5000, // Same cost for transfer
      }, p1);
      expect(p2.props.currentStock).toBe(800);

      // Transfer to Store 2
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 250,
        unitPriceInCents: 5000,
      }, p2);
      expect(p3.props.currentStock).toBe(550);

      // Transfer to Store 3
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 150,
        unitPriceInCents: 5000,
      }, p3);
      expect(p4.props.currentStock).toBe(400);

      // Return from Store 1 (overstock)
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, p4);
      expect(p5.props.currentStock).toBe(450);

      // Direct sales from warehouse
      const { product: p6 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 10000,
      }, p5);
      expect(p6.props.currentStock).toBe(350);
    });

    it('should handle multiple price points in same day', () => {
      // Morning - Regular price
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 500,
        unitPriceInCents: 5000,
      }, product);

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(450);

      // Afternoon - Flash sale
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 8000,
      }, p2);
      expect(p3.props.currentStock).toBe(350);

      // Evening - Back to regular
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 10000,
      }, p3);
      expect(p4.props.currentStock).toBe(320);

      // Night - Clearance price
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 70,
        unitPriceInCents: 7000,
      }, p4);
      expect(p5.props.currentStock).toBe(250);
    });

    it('should prevent overselling when stock runs low', () => {
      // Limited stock
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Sale reducing to low stock
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 45,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(5);

      // Can sell remaining 5
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 5,
        unitPriceInCents: 10000,
      }, p2);
      expect(p3.props.currentStock).toBe(0);

      // Cannot sell more - should throw error
      expect(() => {
        ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 1,
          unitPriceInCents: 10000,
        }, p3);
      }).toThrow(InsufficientStockError);

      // Restock arrives
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, p3);
      expect(p4.props.currentStock).toBe(100);

      // Now can sell again
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 20,
        unitPriceInCents: 10000,
      }, p4);
      expect(p5.props.currentStock).toBe(80);
    });

    it('should simulate consignment operations', () => {
      // Receive consignment goods (input at consignment cost)
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 200,
        unitPriceInCents: 4000, // Consignment cost
      }, product);

      // Sell consignment items
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 80,
        unitPriceInCents: 10000, // Retail price
      }, p1);
      expect(p2.props.currentStock).toBe(120);

      // Return unsold to consignor
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 4000, // At consignment cost
      }, p2);
      expect(p3.props.currentStock).toBe(70);

      // Sell remaining
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 70,
        unitPriceInCents: 10000,
      }, p3);
      expect(p4.props.currentStock).toBe(0);
    });

    it('should handle emergency stock verification and adjustment', () => {
      // Recorded stock
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 500,
        unitPriceInCents: 5000,
      }, product);

      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 200,
        unitPriceInCents: 10000,
      }, p1);
      expect(p2.props.currentStock).toBe(300); // System shows 300

      // Physical count finds only 280 (20 missing - theft/loss/error)
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 20,
        unitPriceInCents: 0, // Adjustment for missing items
      }, p2);
      expect(p3.props.currentStock).toBe(280);

      // Continue operations with corrected stock
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 50,
        unitPriceInCents: 10000,
      }, p3);
      expect(p4.props.currentStock).toBe(230);

      // Another count finds extra 10 items (were misplaced)
      const { product: p5 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 10,
        unitPriceInCents: 5000,
      }, p4);
      expect(p5.props.currentStock).toBe(240);
    });

    it('should simulate bulk order processing', () => {
      // Large wholesale order comes in
      const { product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 5000,
        unitPriceInCents: 4500,
      }, product);
      expect(p1.props.currentStock).toBe(5000);

      // Bulk sale to Client 1
      const { product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 1000,
        unitPriceInCents: 8000, // Wholesale price
      }, p1);
      expect(p2.props.currentStock).toBe(4000);

      // Bulk sale to Client 2
      const { product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 1500,
        unitPriceInCents: 8000,
      }, p2);
      expect(p3.props.currentStock).toBe(2500);

      // Retail sales (smaller quantities)
      let current = p3;
      for (let i = 0; i < 50; i++) {
        const { product: p } = ProductStockMovement.create({
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
          quantity: 10,
          unitPriceInCents: 10000, // Retail price
        }, current);
        current = p;
      }
      expect(current.props.currentStock).toBe(2000); // 2500 - (50 * 10)

      // Another bulk sale
      const { product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 800,
        unitPriceInCents: 8000,
      }, current);
      expect(p4.props.currentStock).toBe(1200);
    });
  });
});
