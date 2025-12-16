import { InvalidMaximumStockError } from '../errors/invalid-maximum-stock.error';
import { InvalidMinimumStockError } from '../errors/invalid-minimum-stock.error';
import { InvalidStockRangeError } from '../errors/invalid-stock-range.error';
import { Product, ProductCreateProps, ProductProps } from './product.entity';

describe('Product Entity', () => {
  const mockCreateProps: ProductCreateProps = {
    companyId: 'company-id-123',
    type: 'Finished',
    group01: 'Electronics',
    group02: 'Computers',
    description: 'Laptop Dell Inspiron 15',
    complement: 'Intel Core i7, 16GB RAM, 512GB SSD',
    manufacturerCode: 'DELL-INS-15-2024',
    brand: 'Dell',
    measureUnit: 'UN',
    ncm: '84713000',
    economicBatch: 'LOT-2024-001',
    minimumStock: 5,
    maximumStock: 50,
    warrantyDays: 365,
    weightInKg: 2.5,
    heightInCm: 2.5,
    lengthInCm: 35.8,
    widthInCm: 25.4,
    markup: 45,
    marginB: 30,
    currency: 'BRL',
    exchangeRate: 1.0,
    unitCostInCents: 250000,
    unitPriceInCents: 362500,
    ean: '7891234567890',
    additionalInfo: 'Product available for immediate delivery',
    images: ['https://cdn.example.com/laptop1.jpg', 'https://cdn.example.com/laptop2.jpg'],
    supplierIds: ['supplier-id-1', 'supplier-id-2'],
  };

  const mockLoadProps: ProductProps = {
    id: 'product-id-123',
    currentStock: 25,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-15T10:30:00Z'),
    ...mockCreateProps,
  };

  describe('create', () => {
    it('should create a product with valid props', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product).toBeInstanceOf(Product);
      expect(product.props.id).toBeDefined();
      expect(product.props.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create a product with currentStock initialized to 0', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product.props.currentStock).toBe(0);
    });

    it('should create a product with createdAt timestamp', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      const afterCreate = new Date();
      expect(product.props.createdAt).toBeInstanceOf(Date);
      expect(product.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(product.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create a product with updatedAt timestamp', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      const afterCreate = new Date();
      expect(product.props.updatedAt).toBeInstanceOf(Date);
      expect(product.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(product.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create a product with all required properties', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product.props.companyId).toBe(mockCreateProps.companyId);
      expect(product.props.type).toBe(mockCreateProps.type);
      expect(product.props.group01).toBe(mockCreateProps.group01);
      expect(product.props.group02).toBe(mockCreateProps.group02);
      expect(product.props.description).toBe(mockCreateProps.description);
      expect(product.props.manufacturerCode).toBe(mockCreateProps.manufacturerCode);
      expect(product.props.brand).toBe(mockCreateProps.brand);
      expect(product.props.measureUnit).toBe(mockCreateProps.measureUnit);
      expect(product.props.ncm).toBe(mockCreateProps.ncm);
      expect(product.props.economicBatch).toBe(mockCreateProps.economicBatch);
      expect(product.props.ean).toBe(mockCreateProps.ean);
    });

    it('should create a product with numeric properties', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product.props.minimumStock).toBe(5);
      expect(product.props.maximumStock).toBe(50);
      expect(product.props.warrantyDays).toBe(365);
      expect(product.props.weightInKg).toBe(2.5);
      expect(product.props.heightInCm).toBe(2.5);
      expect(product.props.lengthInCm).toBe(35.8);
      expect(product.props.widthInCm).toBe(25.4);
      expect(product.props.markup).toBe(45);
      expect(product.props.marginB).toBe(30);
      expect(product.props.exchangeRate).toBe(1.0);
      expect(product.props.unitCostInCents).toBe(250000);
      expect(product.props.unitPriceInCents).toBe(362500);
    });

    it('should create a product with optional complement', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product.props.complement).toBe('Intel Core i7, 16GB RAM, 512GB SSD');
    });

    it('should create a product with null complement when not provided', () => {
      // Arrange
      const propsWithoutComplement = { ...mockCreateProps, complement: undefined };

      // Act
      const product = Product.create(propsWithoutComplement);

      // Assert
      expect(product.props.complement).toBeNull();
    });

    it('should create a product with optional additionalInfo', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product.props.additionalInfo).toBe('Product available for immediate delivery');
    });

    it('should create a product with null additionalInfo when not provided', () => {
      // Arrange
      const propsWithoutAdditionalInfo = { ...mockCreateProps, additionalInfo: undefined };

      // Act
      const product = Product.create(propsWithoutAdditionalInfo);

      // Assert
      expect(product.props.additionalInfo).toBeNull();
    });

    it('should create a product with images array', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product.props.images).toEqual([
        'https://cdn.example.com/laptop1.jpg',
        'https://cdn.example.com/laptop2.jpg',
      ]);
      expect(product.props.images).toHaveLength(2);
    });

    it('should create a product with empty images array', () => {
      // Arrange
      const propsWithoutImages = { ...mockCreateProps, images: [] };

      // Act
      const product = Product.create(propsWithoutImages);

      // Assert
      expect(product.props.images).toEqual([]);
      expect(product.props.images).toHaveLength(0);
    });

    it('should create a product with supplierIds array', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(product.props.supplierIds).toEqual(['supplier-id-1', 'supplier-id-2']);
      expect(product.props.supplierIds).toHaveLength(2);
    });

    it('should create a product with empty supplierIds array', () => {
      // Arrange
      const propsWithoutSuppliers = { ...mockCreateProps, supplierIds: [] };

      // Act
      const product = Product.create(propsWithoutSuppliers);

      // Assert
      expect(product.props.supplierIds).toEqual([]);
      expect(product.props.supplierIds).toHaveLength(0);
    });

    it('should create products with unique IDs', () => {
      // Act
      const product1 = Product.create(mockCreateProps);
      const product2 = Product.create(mockCreateProps);
      const product3 = Product.create(mockCreateProps);

      // Assert
      expect(product1.props.id).not.toBe(product2.props.id);
      expect(product2.props.id).not.toBe(product3.props.id);
      expect(product1.props.id).not.toBe(product3.props.id);
    });

    describe('stock validation', () => {
      describe('minimumStock validation (must be >= 0)', () => {
        it('should throw InvalidMinimumStockError when minimumStock is negative', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: -1,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidMinimumStockError);
        });

        it('should throw InvalidMinimumStockError with correct message', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: -10,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow('Estoque mínimo deve ser maior ou igual a 0');
        });

        it('should throw InvalidMinimumStockError with large negative value', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: -1000000,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidMinimumStockError);
        });

        it('should create product when minimumStock is zero', () => {
          // Arrange
          const validProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 0,
            maximumStock: 50,
          };

          // Act
          const product = Product.create(validProps);

          // Assert
          expect(product).toBeInstanceOf(Product);
          expect(product.props.minimumStock).toBe(0);
        });
      });

      describe('maximumStock validation (must be >= 0)', () => {
        it('should throw InvalidMaximumStockError when maximumStock is negative', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 0,
            maximumStock: -1,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidMaximumStockError);
        });

        it('should throw InvalidMaximumStockError with correct message', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 0,
            maximumStock: -10,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow('Estoque máximo deve ser maior ou igual a 0');
        });

        it('should throw InvalidMaximumStockError with large negative value', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 0,
            maximumStock: -1000000,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidMaximumStockError);
        });

        it('should create product when maximumStock is zero', () => {
          // Arrange
          const validProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 0,
            maximumStock: 0,
          };

          // Act
          const product = Product.create(validProps);

          // Assert
          expect(product).toBeInstanceOf(Product);
          expect(product.props.maximumStock).toBe(0);
        });
      });

      describe('stock range validation (minimumStock <= maximumStock)', () => {
        it('should throw InvalidStockRangeError when minimumStock is greater than maximumStock', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 100,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidStockRangeError);
        });

        it('should throw InvalidStockRangeError with correct message', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 100,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow('Estoque mínimo deve ser menor ou igual ao estoque máximo');
        });

        it('should create product when minimumStock equals maximumStock', () => {
          // Arrange
          const validProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 50,
            maximumStock: 50,
          };

          // Act
          const product = Product.create(validProps);

          // Assert
          expect(product).toBeInstanceOf(Product);
          expect(product.props.minimumStock).toBe(50);
          expect(product.props.maximumStock).toBe(50);
        });

        it('should create product when minimumStock is less than maximumStock', () => {
          // Arrange
          const validProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 10,
            maximumStock: 100,
          };

          // Act
          const product = Product.create(validProps);

          // Assert
          expect(product).toBeInstanceOf(Product);
          expect(product.props.minimumStock).toBe(10);
          expect(product.props.maximumStock).toBe(100);
        });

        it('should create product when both minimumStock and maximumStock are zero', () => {
          // Arrange
          const validProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 0,
            maximumStock: 0,
          };

          // Act
          const product = Product.create(validProps);

          // Assert
          expect(product).toBeInstanceOf(Product);
          expect(product.props.minimumStock).toBe(0);
          expect(product.props.maximumStock).toBe(0);
        });

        it('should create product when minimumStock is zero and maximumStock is positive', () => {
          // Arrange
          const validProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 0,
            maximumStock: 100,
          };

          // Act
          const product = Product.create(validProps);

          // Assert
          expect(product).toBeInstanceOf(Product);
          expect(product.props.minimumStock).toBe(0);
          expect(product.props.maximumStock).toBe(100);
        });

        it('should throw InvalidStockRangeError when minimumStock is 1 more than maximumStock', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 51,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidStockRangeError);
        });

        it('should throw InvalidStockRangeError with large stock difference', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 1000000,
            maximumStock: 1,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidStockRangeError);
        });
      });

      describe('validation order (minimumStock checked first, then maximumStock, then range)', () => {
        it('should throw InvalidMinimumStockError before InvalidMaximumStockError when both are negative', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: -5,
            maximumStock: -10,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidMinimumStockError);
        });

        it('should throw InvalidMaximumStockError before InvalidStockRangeError when maximumStock is negative but minimumStock is valid', () => {
          // Arrange
          const invalidProps: ProductCreateProps = {
            ...mockCreateProps,
            minimumStock: 10,
            maximumStock: -5,
          };

          // Act & Assert
          expect(() => Product.create(invalidProps)).toThrow(InvalidMaximumStockError);
        });
      });
    });
  });

  describe('load', () => {
    it('should load a product with existing props', () => {
      // Act
      const product = Product.load(mockLoadProps);

      // Assert
      expect(product).toBeInstanceOf(Product);
      expect(product.props.id).toBe('product-id-123');
    });

    it('should load a product with specified currentStock', () => {
      // Act
      const product = Product.load(mockLoadProps);

      // Assert
      expect(product.props.currentStock).toBe(25);
    });

    it('should load a product with specified timestamps', () => {
      // Act
      const product = Product.load(mockLoadProps);

      // Assert
      expect(product.props.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(product.props.updatedAt).toEqual(new Date('2024-06-15T10:30:00Z'));
    });

    it('should load a product with all properties intact', () => {
      // Act
      const product = Product.load(mockLoadProps);

      // Assert
      expect(product.props.id).toBe(mockLoadProps.id);
      expect(product.props.currentStock).toBe(mockLoadProps.currentStock);
      expect(product.props.createdAt).toBe(mockLoadProps.createdAt);
      expect(product.props.updatedAt).toBe(mockLoadProps.updatedAt);
      expect(product.props.companyId).toBe(mockLoadProps.companyId);
      expect(product.props.type).toBe(mockLoadProps.type);
      expect(product.props.group01).toBe(mockLoadProps.group01);
      expect(product.props.group02).toBe(mockLoadProps.group02);
      expect(product.props.description).toBe(mockLoadProps.description);
      expect(product.props.complement).toBe(mockLoadProps.complement);
      expect(product.props.manufacturerCode).toBe(mockLoadProps.manufacturerCode);
      expect(product.props.brand).toBe(mockLoadProps.brand);
      expect(product.props.measureUnit).toBe(mockLoadProps.measureUnit);
      expect(product.props.ncm).toBe(mockLoadProps.ncm);
      expect(product.props.economicBatch).toBe(mockLoadProps.economicBatch);
      expect(product.props.minimumStock).toBe(mockLoadProps.minimumStock);
      expect(product.props.maximumStock).toBe(mockLoadProps.maximumStock);
      expect(product.props.warrantyDays).toBe(mockLoadProps.warrantyDays);
      expect(product.props.weightInKg).toBe(mockLoadProps.weightInKg);
      expect(product.props.heightInCm).toBe(mockLoadProps.heightInCm);
      expect(product.props.lengthInCm).toBe(mockLoadProps.lengthInCm);
      expect(product.props.widthInCm).toBe(mockLoadProps.widthInCm);
      expect(product.props.markup).toBe(mockLoadProps.markup);
      expect(product.props.marginB).toBe(mockLoadProps.marginB);
      expect(product.props.currency).toBe(mockLoadProps.currency);
      expect(product.props.exchangeRate).toBe(mockLoadProps.exchangeRate);
      expect(product.props.unitCostInCents).toBe(mockLoadProps.unitCostInCents);
      expect(product.props.unitPriceInCents).toBe(mockLoadProps.unitPriceInCents);
      expect(product.props.ean).toBe(mockLoadProps.ean);
      expect(product.props.additionalInfo).toBe(mockLoadProps.additionalInfo);
      expect(product.props.images).toEqual(mockLoadProps.images);
      expect(product.props.supplierIds).toEqual(mockLoadProps.supplierIds);
    });

    it('should load a product with zero current stock', () => {
      // Arrange
      const propsWithZeroStock = { ...mockLoadProps, currentStock: 0 };

      // Act
      const product = Product.load(propsWithZeroStock);

      // Assert
      expect(product.props.currentStock).toBe(0);
    });

    it('should load a product with negative current stock', () => {
      // Arrange
      const propsWithNegativeStock = { ...mockLoadProps, currentStock: -10 };

      // Act
      const product = Product.load(propsWithNegativeStock);

      // Assert
      expect(product.props.currentStock).toBe(-10);
    });

    describe('stock validation (applied via constructor)', () => {
      it('should throw InvalidMinimumStockError when loading with negative minimumStock', () => {
        // Arrange
        const invalidProps: ProductProps = {
          ...mockLoadProps,
          minimumStock: -1,
          maximumStock: 50,
        };

        // Act & Assert
        expect(() => Product.load(invalidProps)).toThrow(InvalidMinimumStockError);
      });

      it('should throw InvalidMaximumStockError when loading with negative maximumStock', () => {
        // Arrange
        const invalidProps: ProductProps = {
          ...mockLoadProps,
          minimumStock: 0,
          maximumStock: -1,
        };

        // Act & Assert
        expect(() => Product.load(invalidProps)).toThrow(InvalidMaximumStockError);
      });

      it('should throw InvalidStockRangeError when loading with minimumStock > maximumStock', () => {
        // Arrange
        const invalidProps: ProductProps = {
          ...mockLoadProps,
          minimumStock: 100,
          maximumStock: 50,
        };

        // Act & Assert
        expect(() => Product.load(invalidProps)).toThrow(InvalidStockRangeError);
      });

      it('should load product with valid stock values', () => {
        // Arrange
        const validProps: ProductProps = {
          ...mockLoadProps,
          minimumStock: 10,
          maximumStock: 100,
        };

        // Act
        const product = Product.load(validProps);

        // Assert
        expect(product).toBeInstanceOf(Product);
        expect(product.props.minimumStock).toBe(10);
        expect(product.props.maximumStock).toBe(100);
      });
    });
  });

  describe('constructor', () => {
    it('should create instance via constructor', () => {
      // Act
      const product = new Product(mockLoadProps);

      // Assert
      expect(product).toBeInstanceOf(Product);
      expect(product.props.id).toBe('product-id-123');
    });

    it('should assign all properties correctly', () => {
      // Act
      const product = new Product(mockLoadProps);

      // Assert
      expect(product.props.id).toBe(mockLoadProps.id);
      expect(product.props.currentStock).toBe(mockLoadProps.currentStock);
      expect(product.props.createdAt).toBe(mockLoadProps.createdAt);
      expect(product.props.updatedAt).toBe(mockLoadProps.updatedAt);
      expect(product.props.companyId).toBe(mockLoadProps.companyId);
      expect(product.props.type).toBe(mockLoadProps.type);
      expect(product.props.group01).toBe(mockLoadProps.group01);
      expect(product.props.group02).toBe(mockLoadProps.group02);
      expect(product.props.description).toBe(mockLoadProps.description);
      expect(product.props.manufacturerCode).toBe(mockLoadProps.manufacturerCode);
      expect(product.props.brand).toBe(mockLoadProps.brand);
      expect(product.props.measureUnit).toBe(mockLoadProps.measureUnit);
      expect(product.props.ncm).toBe(mockLoadProps.ncm);
      expect(product.props.economicBatch).toBe(mockLoadProps.economicBatch);
      expect(product.props.ean).toBe(mockLoadProps.ean);
    });

    it('should handle null complement in constructor', () => {
      // Arrange
      const propsWithNullComplement = { ...mockLoadProps, complement: null };

      // Act
      const product = new Product(propsWithNullComplement);

      // Assert
      expect(product.props.complement).toBeNull();
    });

    it('should handle null additionalInfo in constructor', () => {
      // Arrange
      const propsWithNullAdditionalInfo = { ...mockLoadProps, additionalInfo: null };

      // Act
      const product = new Product(propsWithNullAdditionalInfo);

      // Assert
      expect(product.props.additionalInfo).toBeNull();
    });

    it('should isolate images array', () => {
      // Arrange
      const images = ['image1.jpg', 'image2.jpg'];
      const propsWithImages = { ...mockLoadProps, images };

      // Act
      const product = new Product(propsWithImages);
      images.push('image3.jpg');

      // Assert
      expect(product.props.images).toHaveLength(2);
      expect(product.props.images).not.toContain('image3.jpg');
    });

    it('should isolate supplierIds array', () => {
      // Arrange
      const supplierIds = ['supplier-1', 'supplier-2'];
      const propsWithSuppliers = { ...mockLoadProps, supplierIds };

      // Act
      const product = new Product(propsWithSuppliers);
      supplierIds.push('supplier-3');

      // Assert
      expect(product.props.supplierIds).toHaveLength(2);
      expect(product.props.supplierIds).not.toContain('supplier-3');
    });

    it('should handle empty images array', () => {
      // Arrange
      const propsWithEmptyImages = { ...mockLoadProps, images: [] };

      // Act
      const product = new Product(propsWithEmptyImages);

      // Assert
      expect(product.props.images).toEqual([]);
      expect(Array.isArray(product.props.images)).toBe(true);
    });

    it('should handle empty supplierIds array', () => {
      // Arrange
      const propsWithEmptySuppliers = { ...mockLoadProps, supplierIds: [] };

      // Act
      const product = new Product(propsWithEmptySuppliers);

      // Assert
      expect(product.props.supplierIds).toEqual([]);
      expect(Array.isArray(product.props.supplierIds)).toBe(true);
    });

    describe('stock validation', () => {
      describe('minimumStock validation (must be >= 0)', () => {
        it('should throw InvalidMinimumStockError when minimumStock is negative', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: -1,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow(InvalidMinimumStockError);
        });

        it('should throw InvalidMinimumStockError with correct message', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: -10,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow('Estoque mínimo deve ser maior ou igual a 0');
        });

        it('should allow minimumStock of zero', () => {
          // Arrange
          const validProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 0,
            maximumStock: 50,
          };

          // Act
          const product = new Product(validProps);

          // Assert
          expect(product.props.minimumStock).toBe(0);
        });
      });

      describe('maximumStock validation (must be >= 0)', () => {
        it('should throw InvalidMaximumStockError when maximumStock is negative', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 0,
            maximumStock: -1,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow(InvalidMaximumStockError);
        });

        it('should throw InvalidMaximumStockError with correct message', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 0,
            maximumStock: -10,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow('Estoque máximo deve ser maior ou igual a 0');
        });

        it('should allow maximumStock of zero', () => {
          // Arrange
          const validProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 0,
            maximumStock: 0,
          };

          // Act
          const product = new Product(validProps);

          // Assert
          expect(product.props.maximumStock).toBe(0);
        });
      });

      describe('stock range validation (minimumStock <= maximumStock)', () => {
        it('should throw InvalidStockRangeError when minimumStock > maximumStock', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 100,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow(InvalidStockRangeError);
        });

        it('should throw InvalidStockRangeError with correct message', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 100,
            maximumStock: 50,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow('Estoque mínimo deve ser menor ou igual ao estoque máximo');
        });

        it('should allow minimumStock equal to maximumStock', () => {
          // Arrange
          const validProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 50,
            maximumStock: 50,
          };

          // Act
          const product = new Product(validProps);

          // Assert
          expect(product.props.minimumStock).toBe(50);
          expect(product.props.maximumStock).toBe(50);
        });

        it('should allow minimumStock less than maximumStock', () => {
          // Arrange
          const validProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 10,
            maximumStock: 100,
          };

          // Act
          const product = new Product(validProps);

          // Assert
          expect(product.props.minimumStock).toBe(10);
          expect(product.props.maximumStock).toBe(100);
        });
      });

      describe('validation order', () => {
        it('should throw InvalidMinimumStockError before InvalidMaximumStockError when both are negative', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: -5,
            maximumStock: -10,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow(InvalidMinimumStockError);
        });

        it('should throw InvalidMaximumStockError before InvalidStockRangeError when maximumStock is negative', () => {
          // Arrange
          const invalidProps: ProductProps = {
            ...mockLoadProps,
            minimumStock: 10,
            maximumStock: -5,
          };

          // Act & Assert
          expect(() => new Product(invalidProps)).toThrow(InvalidMaximumStockError);
        });
      });
    });
  });

  describe('props getter', () => {
    it('should return a copy of props', () => {
      // Arrange
      const product = Product.create(mockCreateProps);
      const props1 = product.props;
      const props2 = product.props;

      // Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2); // Different objects
    });

    it('should not allow mutation of images array through getter', () => {
      // Arrange
      const product = Product.create(mockCreateProps);

      // Act
      const props = product.props;
      props.images.push('https://cdn.example.com/new-image.jpg');

      // Assert
      expect(product.props.images).toHaveLength(2);
      expect(product.props.images).not.toContain('https://cdn.example.com/new-image.jpg');
    });

    it('should not allow mutation of supplierIds array through getter', () => {
      // Arrange
      const product = Product.create(mockCreateProps);

      // Act
      const props = product.props;
      props.supplierIds.push('new-supplier-id');

      // Assert
      expect(product.props.supplierIds).toHaveLength(2);
      expect(product.props.supplierIds).not.toContain('new-supplier-id');
    });

    it('should return readonly props', () => {
      // Arrange
      const product = Product.create(mockCreateProps);

      // Act
      const props = product.props;

      // Assert - TypeScript should prevent this, but we test runtime behavior
      expect(() => {
        // @ts-expect-error - Testing immutability
        props.description = 'Modified Description';
      }).not.toThrow();

      // Original props should remain unchanged
      expect(product.props.description).toBe(mockCreateProps.description);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values for numeric fields', () => {
      // Arrange
      const propsWithZeros: ProductCreateProps = {
        ...mockCreateProps,
        minimumStock: 0,
        maximumStock: 0,
        warrantyDays: 0,
        weightInKg: 0,
        heightInCm: 0,
        lengthInCm: 0,
        widthInCm: 0,
        markup: 0,
        marginB: 0,
        exchangeRate: 0,
        unitCostInCents: 0,
        unitPriceInCents: 0,
      };

      // Act
      const product = Product.create(propsWithZeros);

      // Assert
      expect(product.props.minimumStock).toBe(0);
      expect(product.props.maximumStock).toBe(0);
      expect(product.props.warrantyDays).toBe(0);
      expect(product.props.weightInKg).toBe(0);
      expect(product.props.markup).toBe(0);
      expect(product.props.unitCostInCents).toBe(0);
    });

    it('should handle negative values for non-stock numeric fields', () => {
      // Arrange
      const propsWithNegatives: ProductCreateProps = {
        ...mockCreateProps,
        markup: -15,
        marginB: -20,
        weightInKg: -1, // Although unlikely in real world, entity allows it
        exchangeRate: -0.5,
      };

      // Act
      const product = Product.create(propsWithNegatives);

      // Assert
      expect(product.props.markup).toBe(-15);
      expect(product.props.marginB).toBe(-20);
      expect(product.props.weightInKg).toBe(-1);
      expect(product.props.exchangeRate).toBe(-0.5);
    });

    it('should not allow negative minimumStock (throws error)', () => {
      // Arrange
      const propsWithNegativeMinStock: ProductCreateProps = {
        ...mockCreateProps,
        minimumStock: -1,
      };

      // Act & Assert
      expect(() => Product.create(propsWithNegativeMinStock)).toThrow(InvalidMinimumStockError);
    });

    it('should not allow negative maximumStock (throws error)', () => {
      // Arrange
      const propsWithNegativeMaxStock: ProductCreateProps = {
        ...mockCreateProps,
        minimumStock: 0,
        maximumStock: -1,
      };

      // Act & Assert
      expect(() => Product.create(propsWithNegativeMaxStock)).toThrow(InvalidMaximumStockError);
    });

    it('should handle very large numeric values', () => {
      // Arrange
      const propsWithLargeNumbers: ProductCreateProps = {
        ...mockCreateProps,
        maximumStock: 999999999,
        unitCostInCents: 999999999999,
        unitPriceInCents: 999999999999,
        warrantyDays: 36500, // 100 years
      };

      // Act
      const product = Product.create(propsWithLargeNumbers);

      // Assert
      expect(product.props.maximumStock).toBe(999999999);
      expect(product.props.unitCostInCents).toBe(999999999999);
      expect(product.props.unitPriceInCents).toBe(999999999999);
      expect(product.props.warrantyDays).toBe(36500);
    });

    it('should handle decimal values for weight and dimensions', () => {
      // Arrange
      const propsWithDecimals: ProductCreateProps = {
        ...mockCreateProps,
        weightInKg: 0.001,
        heightInCm: 0.5,
        lengthInCm: 100.999,
        widthInCm: 50.555,
      };

      // Act
      const product = Product.create(propsWithDecimals);

      // Assert
      expect(product.props.weightInKg).toBe(0.001);
      expect(product.props.heightInCm).toBe(0.5);
      expect(product.props.lengthInCm).toBe(100.999);
      expect(product.props.widthInCm).toBe(50.555);
    });

    it('should handle empty strings for text fields', () => {
      // Arrange
      const propsWithEmptyStrings: ProductCreateProps = {
        ...mockCreateProps,
        description: '',
        brand: '',
        ean: '',
      };

      // Act
      const product = Product.create(propsWithEmptyStrings);

      // Assert
      expect(product.props.description).toBe('');
      expect(product.props.brand).toBe('');
      expect(product.props.ean).toBe('');
    });

    it('should handle very long strings', () => {
      // Arrange
      const longString = 'A'.repeat(1000);
      const propsWithLongStrings: ProductCreateProps = {
        ...mockCreateProps,
        description: longString,
        complement: longString,
        additionalInfo: longString,
      };

      // Act
      const product = Product.create(propsWithLongStrings);

      // Assert
      expect(product.props.description).toHaveLength(1000);
      expect(product.props.complement).toHaveLength(1000);
      expect(product.props.additionalInfo).toHaveLength(1000);
    });

    it('should handle special characters in strings', () => {
      // Arrange
      const propsWithSpecialChars: ProductCreateProps = {
        ...mockCreateProps,
        description: 'Product with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        complement: 'Ação, Reação, Ñ, ç',
        brand: 'Brand™ & Co®',
      };

      // Act
      const product = Product.create(propsWithSpecialChars);

      // Assert
      expect(product.props.description).toContain('!@#$%^&*()');
      expect(product.props.complement).toContain('Ação');
      expect(product.props.brand).toContain('™');
    });

    it('should handle unicode characters', () => {
      // Arrange
      const propsWithUnicode: ProductCreateProps = {
        ...mockCreateProps,
        description: 'Product 产品 製品 🚀',
        brand: 'Brand日本',
      };

      // Act
      const product = Product.create(propsWithUnicode);

      // Assert
      expect(product.props.description).toContain('产品');
      expect(product.props.description).toContain('🚀');
      expect(product.props.brand).toContain('日本');
    });

    it('should handle single item arrays', () => {
      // Arrange
      const propsWithSingleItems: ProductCreateProps = {
        ...mockCreateProps,
        images: ['single-image.jpg'],
        supplierIds: ['single-supplier'],
      };

      // Act
      const product = Product.create(propsWithSingleItems);

      // Assert
      expect(product.props.images).toHaveLength(1);
      expect(product.props.supplierIds).toHaveLength(1);
    });

    it('should handle very large arrays', () => {
      // Arrange
      const manyImages = Array.from({ length: 100 }, (_, i) => `image${i}.jpg`);
      const manySuppliers = Array.from({ length: 100 }, (_, i) => `supplier-${i}`);
      const propsWithLargeArrays: ProductCreateProps = {
        ...mockCreateProps,
        images: manyImages,
        supplierIds: manySuppliers,
      };

      // Act
      const product = Product.create(propsWithLargeArrays);

      // Assert
      expect(product.props.images).toHaveLength(100);
      expect(product.props.supplierIds).toHaveLength(100);
    });

    it('should handle different currency codes', () => {
      // Arrange
      const currencies = ['USD', 'EUR', 'JPY', 'GBP', 'BRL'];

      currencies.forEach(currency => {
        const propsWithCurrency: ProductCreateProps = {
          ...mockCreateProps,
          currency,
        };

        // Act
        const product = Product.create(propsWithCurrency);

        // Assert
        expect(product.props.currency).toBe(currency);
      });
    });

    it('should handle different measure units', () => {
      // Arrange
      const units = ['UN', 'KG', 'M', 'L', 'CX'];

      units.forEach(unit => {
        const propsWithUnit: ProductCreateProps = {
          ...mockCreateProps,
          measureUnit: unit,
        };

        // Act
        const product = Product.create(propsWithUnit);

        // Assert
        expect(product.props.measureUnit).toBe(unit);
      });
    });

    it('should preserve array order', () => {
      // Arrange
      const orderedImages = ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'];
      const propsWithOrderedImages: ProductCreateProps = {
        ...mockCreateProps,
        images: orderedImages,
      };

      // Act
      const product = Product.create(propsWithOrderedImages);

      // Assert
      expect(product.props.images[0]).toBe('img1.jpg');
      expect(product.props.images[1]).toBe('img2.jpg');
      expect(product.props.images[2]).toBe('img3.jpg');
      expect(product.props.images[3]).toBe('img4.jpg');
    });
  });

  describe('invariant protection', () => {
    it('should have exactly 32 properties in _props', () => {
      // Act
      const product = Product.create(mockCreateProps);

      // Assert
      expect(Object.keys(product.props)).toHaveLength(32);
    });

    it('should not allow extra properties via create', () => {
      // Arrange
      const propsWithExtra = {
        ...mockCreateProps,
        extraProperty: 'should not be included',
      } as any;

      // Act
      const product = Product.create(propsWithExtra);

      // Assert
      expect(product.props).not.toHaveProperty('extraProperty');
      expect(Object.keys(product.props)).toHaveLength(32);
    });

    it('should not allow extra properties via load', () => {
      // Arrange
      const propsWithExtra = {
        ...mockLoadProps,
        extraProperty: 'should not be included',
      } as any;

      // Act
      const product = Product.load(propsWithExtra);

      // Assert
      expect(product.props).not.toHaveProperty('extraProperty');
      expect(Object.keys(product.props)).toHaveLength(32);
    });

    it('should isolate images array from external modifications', () => {
      // Arrange
      const images = ['img1.jpg', 'img2.jpg'];
      const propsWithImages: ProductCreateProps = {
        ...mockCreateProps,
        images,
      };

      // Act
      const product = Product.create(propsWithImages);
      images.push('img3.jpg');
      images[0] = 'modified.jpg';

      // Assert
      expect(product.props.images).toHaveLength(2);
      expect(product.props.images[0]).toBe('img1.jpg');
      expect(product.props.images).not.toContain('img3.jpg');
    });

    it('should isolate supplierIds array from external modifications', () => {
      // Arrange
      const supplierIds = ['supplier-1', 'supplier-2'];
      const propsWithSuppliers: ProductCreateProps = {
        ...mockCreateProps,
        supplierIds,
      };

      // Act
      const product = Product.create(propsWithSuppliers);
      supplierIds.push('supplier-3');
      supplierIds[0] = 'modified-supplier';

      // Assert
      expect(product.props.supplierIds).toHaveLength(2);
      expect(product.props.supplierIds[0]).toBe('supplier-1');
      expect(product.props.supplierIds).not.toContain('supplier-3');
    });
  });
});
