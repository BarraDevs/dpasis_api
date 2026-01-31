import { Test } from '@nestjs/testing';
import { Company, Supplier } from '@prisma/client';
import { ProductPersistenceModule } from 'src/app/product/application/persistence/product-persistence.module';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProductRepositoryAdapterPrisma } from './product.repository';

describe('ProductRepositoryAdapterPrisma', () => {
  let sut: ProductRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;
  let supplier01: Supplier;
  let supplier02: Supplier;

  const createProductProps = (overrides = {}) => ({
    companyId: company.id,
    type: 'Eletrônico',
    group01: 'Informática',
    group02: 'Computadores',
    description: 'Notebook Dell Inspiron',
    complement: 'Core i7 16GB',
    manufacturerCode: 'DELL-001',
    brand: 'Dell',
    measureUnit: 'UN',
    ncm: '84713012',
    economicBatch: 'BATCH001',
    minimumStock: 5,
    maximumStock: 50,
    warrantyDays: 365,
    weightInKg: 2.5,
    heightInCm: 3.0,
    lengthInCm: 35.0,
    widthInCm: 25.0,
    markup: 30,
    marginB: 20,
    currency: 'BRL',
    exchangeRate: 1.0,
    unitCostInCents: 350000,
    unitPriceInCents: 450000,
    ean: '7891234567890',
    additionalInfo: 'Informação adicional',
    images: ['https://example.com/image1.jpg'],
    supplierIds: [supplier01.id],
    ...overrides,
  });

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProductPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ProductRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ProductRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();

    company = await prisma.company.create({
      data: {
        name: 'Company Test',
        fantasyName: 'Company Test Fantasy',
        document: '11222333000181',
        ie: 'ie teste',
        zipCode: 'zipCode teste',
        street: 'street teste',
        number: 'number teste',
        neighborhood: 'neighborhood teste',
        city: 'city teste',
        state: 'state teste',
        phone01: 'phone01 teste',
        email01: 'email01 teste',
        active: true,
      },
    });

    supplier01 = await prisma.supplier.create({
      data: {
        id: 'supplier-01',
        cnpj: '33444555000172',
        ie: '111222333',
        group: 'Group A',
        type: 'Type A',
        companyName: 'Supplier Company 01',
        fantasyName: 'Supplier Fantasy 01',
        representative: 'Rep 01',
        active: true,
        companies: { connect: { id: company.id } },
      },
    });

    supplier02 = await prisma.supplier.create({
      data: {
        id: 'supplier-02',
        cnpj: '44555666000163',
        ie: '222333444',
        group: 'Group B',
        type: 'Type B',
        companyName: 'Supplier Company 02',
        fantasyName: 'Supplier Fantasy 02',
        representative: 'Rep 02',
        active: true,
        companies: { connect: { id: company.id } },
      },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save a product with all required fields', async() => {
      // Arrange
      const product = Product.create(createProductProps());

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(savedProduct).toBeDefined();
      expect(savedProduct?.id).toBe(product.props.id);
      expect(savedProduct?.companyId).toBe(company.id);
      expect(savedProduct?.type).toBe('Eletrônico');
      expect(savedProduct?.group01).toBe('Informática');
      expect(savedProduct?.group02).toBe('Computadores');
      expect(savedProduct?.description).toBe('Notebook Dell Inspiron');
      expect(savedProduct?.complement).toBe('Core i7 16GB');
      expect(savedProduct?.manufacturerCode).toBe('DELL-001');
      expect(savedProduct?.brand).toBe('Dell');
      expect(savedProduct?.measureUnit).toBe('UN');
      expect(savedProduct?.ncm).toBe('84713012');
      expect(savedProduct?.economicBatch).toBe('BATCH001');
      expect(savedProduct?.minimumStock).toBe(5);
      expect(savedProduct?.maximumStock).toBe(50);
      expect(savedProduct?.warrantyDays).toBe(365);
      expect(savedProduct?.weightInKg).toBe(2.5);
      expect(savedProduct?.heightInCm).toBe(3.0);
      expect(savedProduct?.lengthInCm).toBe(35.0);
      expect(savedProduct?.widthInCm).toBe(25.0);
      expect(savedProduct?.markup).toBe(30);
      expect(savedProduct?.marginB).toBe(20);
      expect(savedProduct?.currency).toBe('BRL');
      expect(savedProduct?.exchangeRate).toBe(1.0);
      expect(savedProduct?.unitCostInCents).toBe(350000);
      expect(savedProduct?.unitPriceInCents).toBe(450000);
      expect(savedProduct?.ean).toBe('7891234567890');
      expect(savedProduct?.additionalInfo).toBe('Informação adicional');
      expect(savedProduct?.images).toEqual(['https://example.com/image1.jpg']);
      expect(savedProduct?.currentStock).toBe(0);
      expect(savedProduct?.suppliers).toHaveLength(1);
      expect(savedProduct?.suppliers[0].id).toBe(supplier01.id);
    });

    it('should save a product with multiple suppliers', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [supplier01.id, supplier02.id],
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(savedProduct?.suppliers).toHaveLength(2);
      const supplierIds = savedProduct?.suppliers.map(s => s.id).sort();
      expect(supplierIds).toEqual(['supplier-01', 'supplier-02']);
    });

    it('should save a product with no suppliers', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [],
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(savedProduct?.suppliers).toHaveLength(0);
    });

    it('should save a product with null optional fields', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        complement: null,
        additionalInfo: null,
        images: [],
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.complement).toBeNull();
      expect(savedProduct?.additionalInfo).toBeNull();
      expect(savedProduct?.images).toEqual([]);
    });

    it('should save a product with multiple images', async() => {
      // Arrange
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];
      const product = Product.create(createProductProps({ images }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.images).toEqual(images);
    });

    it('should save a product with different currency', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        currency: 'USD',
        exchangeRate: 5.0,
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.currency).toBe('USD');
      expect(savedProduct?.exchangeRate).toBe(5.0);
    });

    it('should throw error when saving product with non-existent company', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        companyId: 'non-existent-company-id',
      }));

      // Act & Assert
      await expect(sut.save(product)).rejects.toThrow();
    });

    it('should throw error when saving product with non-existent supplier', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: ['non-existent-supplier-id'],
      }));

      // Act & Assert
      await expect(sut.save(product)).rejects.toThrow();
    });
  });

  describe('edit', () => {
    it('should update product properties', async() => {
      // Arrange
      const originalProduct = Product.create(createProductProps());
      await sut.save(originalProduct);

      const updatedProduct = Product.load({
        ...originalProduct.props,
        description: 'Updated Description',
        brand: 'Updated Brand',
        unitPriceInCents: 500000,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: originalProduct.props.id },
      });

      expect(editedProduct?.description).toBe('Updated Description');
      expect(editedProduct?.brand).toBe('Updated Brand');
      expect(editedProduct?.unitPriceInCents).toBe(500000);
    });

    it('should update product suppliers (set new suppliers)', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [supplier01.id],
      }));
      await sut.save(product);

      const updatedProduct = Product.load({
        ...product.props,
        supplierIds: [supplier02.id],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(editedProduct?.suppliers).toHaveLength(1);
      expect(editedProduct?.suppliers[0].id).toBe(supplier02.id);
    });

    it('should update product to have multiple suppliers', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [supplier01.id],
      }));
      await sut.save(product);

      const updatedProduct = Product.load({
        ...product.props,
        supplierIds: [supplier01.id, supplier02.id],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(editedProduct?.suppliers).toHaveLength(2);
      const supplierIds = editedProduct?.suppliers.map(s => s.id).sort();
      expect(supplierIds).toEqual(['supplier-01', 'supplier-02']);
    });

    it('should update product to have no suppliers', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [supplier01.id, supplier02.id],
      }));
      await sut.save(product);

      const updatedProduct = Product.load({
        ...product.props,
        supplierIds: [],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(editedProduct?.suppliers).toHaveLength(0);
    });

    it('should update product images', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        images: ['https://example.com/old.jpg'],
      }));
      await sut.save(product);

      const newImages = [
        'https://example.com/new1.jpg',
        'https://example.com/new2.jpg',
      ];
      const updatedProduct = Product.load({
        ...product.props,
        images: newImages,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(editedProduct?.images).toEqual(newImages);
    });

    it('should update product optional fields to null', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        complement: 'Some complement',
        additionalInfo: 'Some info',
      }));
      await sut.save(product);

      const updatedProduct = Product.load({
        ...product.props,
        complement: null,
        additionalInfo: null,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(editedProduct?.complement).toBeNull();
      expect(editedProduct?.additionalInfo).toBeNull();
    });

    it('should not update currentStock (managed via StockMovements)', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      // Manually set currentStock in database to simulate stock movements
      await prisma.product.update({
        where: { id: product.props.id },
        data: { currentStock: 50 },
      });

      const updatedProduct = Product.load({
        ...product.props,
        currentStock: 100, // This should be ignored
        description: 'Updated Description',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      // currentStock should remain 50 (not updated to 100)
      expect(editedProduct?.currentStock).toBe(50);
      expect(editedProduct?.description).toBe('Updated Description');
    });

    it('should throw error when trying to edit non-existent product', async() => {
      // Arrange
      const nonExistentProduct = Product.load({
        id: 'non-existent-id',
        companyId: company.id,
        type: 'Eletrônico',
        group01: 'Informática',
        group02: 'Computadores',
        description: 'Non Existent Product',
        complement: null,
        manufacturerCode: 'TEST-001',
        brand: 'TestBrand',
        measureUnit: 'UN',
        ncm: '84713012',
        economicBatch: 'BATCH001',
        minimumStock: 5,
        maximumStock: 50,
        warrantyDays: 365,
        weightInKg: 2.5,
        heightInCm: 3.0,
        lengthInCm: 35.0,
        widthInCm: 25.0,
        markup: 30,
        marginB: 20,
        currency: 'BRL',
        exchangeRate: 1.0,
        unitCostInCents: 350000,
        unitPriceInCents: 450000,
        ean: '7891234567890',
        additionalInfo: null,
        images: [],
        supplierIds: [],
        currentStock: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(nonExistentProduct)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing product', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      // Verify product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });
      expect(existingProduct).toBeDefined();

      // Act
      await sut.delete(product.props.id);

      // Assert
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('should delete product and disconnect suppliers (not delete suppliers)', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [supplier01.id, supplier02.id],
      }));
      await sut.save(product);

      // Act
      await sut.delete(product.props.id);

      // Assert - Product should be deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });
      expect(deletedProduct).toBeNull();

      // Assert - Suppliers should still exist
      const existingSupplier01 = await prisma.supplier.findUnique({
        where: { id: supplier01.id },
      });
      const existingSupplier02 = await prisma.supplier.findUnique({
        where: { id: supplier02.id },
      });
      expect(existingSupplier01).toBeDefined();
      expect(existingSupplier02).toBeDefined();
    });

    it('should throw error when trying to delete non-existent product', async() => {
      // Act & Assert
      await expect(sut.delete('non-existent-id')).rejects.toThrow();
    });

    it('should delete product with stock movements (cascade)', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      // Create stock movements for the product
      await prisma.productStockMovement.createMany({
        data: [
          {
            productId: product.props.id,
            type: 'ENTRY',
            quantity: 10,
            unitPriceInCents: 35000,
          },
          {
            productId: product.props.id,
            type: 'EXIT',
            quantity: 5,
            unitPriceInCents: 35000,
          },
        ],
      });

      // Verify stock movements exist
      const movements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
      });
      expect(movements).toHaveLength(2);

      // Act
      await sut.delete(product.props.id);

      // Assert - Product and its movements should be deleted (cascade)
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });
      const deletedMovements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
      });

      expect(deletedProduct).toBeNull();
      expect(deletedMovements).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find a product by id with suppliers', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [supplier01.id, supplier02.id],
      }));
      await sut.save(product);

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.id).toBe(product.props.id);
      expect(foundProduct?.props.description).toBe(product.props.description);
      expect(foundProduct?.props.supplierIds).toHaveLength(2);
      expect(foundProduct?.props.supplierIds).toContain(supplier01.id);
      expect(foundProduct?.props.supplierIds).toContain(supplier02.id);
    });

    it('should return null when product does not exist', async() => {
      // Act
      const foundProduct = await sut.findById('non-existent-id');

      // Assert
      expect(foundProduct).toBeNull();
    });

    it('should find a product with no suppliers', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [],
      }));
      await sut.save(product);

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.supplierIds).toHaveLength(0);
    });

    it('should find a product with all properties intact', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        complement: 'Complete complement',
        additionalInfo: 'Additional information',
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      }));
      await sut.save(product);

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.id).toBe(product.props.id);
      expect(foundProduct?.props.companyId).toBe(product.props.companyId);
      expect(foundProduct?.props.type).toBe(product.props.type);
      expect(foundProduct?.props.group01).toBe(product.props.group01);
      expect(foundProduct?.props.group02).toBe(product.props.group02);
      expect(foundProduct?.props.description).toBe(product.props.description);
      expect(foundProduct?.props.complement).toBe(product.props.complement);
      expect(foundProduct?.props.manufacturerCode).toBe(product.props.manufacturerCode);
      expect(foundProduct?.props.brand).toBe(product.props.brand);
      expect(foundProduct?.props.measureUnit).toBe(product.props.measureUnit);
      expect(foundProduct?.props.ncm).toBe(product.props.ncm);
      expect(foundProduct?.props.economicBatch).toBe(product.props.economicBatch);
      expect(foundProduct?.props.minimumStock).toBe(product.props.minimumStock);
      expect(foundProduct?.props.maximumStock).toBe(product.props.maximumStock);
      expect(foundProduct?.props.warrantyDays).toBe(product.props.warrantyDays);
      expect(foundProduct?.props.weightInKg).toBe(product.props.weightInKg);
      expect(foundProduct?.props.heightInCm).toBe(product.props.heightInCm);
      expect(foundProduct?.props.lengthInCm).toBe(product.props.lengthInCm);
      expect(foundProduct?.props.widthInCm).toBe(product.props.widthInCm);
      expect(foundProduct?.props.markup).toBe(product.props.markup);
      expect(foundProduct?.props.marginB).toBe(product.props.marginB);
      expect(foundProduct?.props.currency).toBe(product.props.currency);
      expect(foundProduct?.props.exchangeRate).toBe(product.props.exchangeRate);
      expect(foundProduct?.props.unitCostInCents).toBe(product.props.unitCostInCents);
      expect(foundProduct?.props.unitPriceInCents).toBe(product.props.unitPriceInCents);
      expect(foundProduct?.props.ean).toBe(product.props.ean);
      expect(foundProduct?.props.additionalInfo).toBe(product.props.additionalInfo);
      expect(foundProduct?.props.images).toEqual(product.props.images);
      expect(foundProduct?.props.currentStock).toBe(product.props.currentStock);
    });

    it('should find a product with null optional fields', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        complement: null,
        additionalInfo: null,
        images: [],
      }));
      await sut.save(product);

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.complement).toBeNull();
      expect(foundProduct?.props.additionalInfo).toBeNull();
      expect(foundProduct?.props.images).toEqual([]);
    });

    it('should find a product after it has been edited', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      const updatedProduct = Product.load({
        ...product.props,
        description: 'Updated Description',
        brand: 'Updated Brand',
        updatedAt: new Date(),
      });
      await sut.edit(updatedProduct);

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.description).toBe('Updated Description');
      expect(foundProduct?.props.brand).toBe('Updated Brand');
    });

    it('should return null after product has been deleted', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);
      await sut.delete(product.props.id);

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeNull();
    });

    it('should find product with correct currentStock value', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      // Simulate stock changes
      await prisma.product.update({
        where: { id: product.props.id },
        data: { currentStock: 25 },
      });

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.currentStock).toBe(25);
    });

    it('should find product with negative stock', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      // Simulate negative stock (overselling scenario)
      await prisma.product.update({
        where: { id: product.props.id },
        data: { currentStock: -5 },
      });

      // Act
      const foundProduct = await sut.findById(product.props.id);

      // Assert
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.currentStock).toBe(-5);
    });

    it('should find multiple different products correctly', async() => {
      // Arrange
      const product1 = Product.create(createProductProps({
        ean: '1111111111111',
        description: 'Product 1',
      }));
      const product2 = Product.create(createProductProps({
        ean: '2222222222222',
        description: 'Product 2',
      }));
      await sut.save(product1);
      await sut.save(product2);

      // Act
      const foundProduct1 = await sut.findById(product1.props.id);
      const foundProduct2 = await sut.findById(product2.props.id);

      // Assert
      expect(foundProduct1?.props.description).toBe('Product 1');
      expect(foundProduct2?.props.description).toBe('Product 2');
      expect(foundProduct1?.props.id).not.toBe(foundProduct2?.props.id);
    });
  });

  describe('save - edge cases', () => {
    it('should save a product with zero stock values', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        minimumStock: 0,
        maximumStock: 0,
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.minimumStock).toBe(0);
      expect(savedProduct?.maximumStock).toBe(0);
    });

    it('should save a product with very large numeric values', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        maximumStock: 999999,
        unitCostInCents: 999999999,
        unitPriceInCents: 999999999,
        warrantyDays: 36500,
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.maximumStock).toBe(999999);
      expect(savedProduct?.unitCostInCents).toBe(999999999);
      expect(savedProduct?.unitPriceInCents).toBe(999999999);
      expect(savedProduct?.warrantyDays).toBe(36500);
    });

    it('should save a product with decimal values for dimensions', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        weightInKg: 1.234,
        heightInCm: 5.678,
        lengthInCm: 9.012,
        widthInCm: 3.456,
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.weightInKg).toBeCloseTo(1.234);
      expect(savedProduct?.heightInCm).toBeCloseTo(5.678);
      expect(savedProduct?.lengthInCm).toBeCloseTo(9.012);
      expect(savedProduct?.widthInCm).toBeCloseTo(3.456);
    });

    it('should save a product with special characters in text fields', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        description: 'Product with special chars: !@#$%^&*()',
        complement: 'Ação, Reação, Ñ, ç',
        brand: 'Brand™ & Co®',
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.description).toContain('!@#$%^&*()');
      expect(savedProduct?.complement).toContain('Ação');
      expect(savedProduct?.brand).toContain('™');
    });

    it('should save a product with very long text fields', async() => {
      // Arrange
      const longText = 'A'.repeat(500);
      const product = Product.create(createProductProps({
        description: longText,
        complement: longText,
        additionalInfo: longText,
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.description).toHaveLength(500);
      expect(savedProduct?.complement).toHaveLength(500);
      expect(savedProduct?.additionalInfo).toHaveLength(500);
    });

    it('should save products with same properties but different IDs', async() => {
      // Arrange
      const props01 = createProductProps({
        description: 'Identical Product',
        ean: '9999999999999',
      });
      const props02 = createProductProps({
        description: 'Identical Product',
        ean: '9999999999998',
      });
      const product1 = Product.create(props01);
      const product2 = Product.create(props02);

      // Act
      await sut.save(product1);
      await sut.save(product2);

      // Assert
      const allProducts = await prisma.product.findMany({
        where: { description: 'Identical Product' },
      });

      expect(allProducts).toHaveLength(2);
      expect(allProducts[0].id).not.toBe(allProducts[1].id);
    });
  });

  describe('edit - edge cases', () => {
    it('should edit all updatable fields at once', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      const updatedProduct = Product.load({
        ...product.props,
        type: 'Updated Type',
        group01: 'Updated Group 01',
        group02: 'Updated Group 02',
        description: 'Updated Description',
        complement: 'Updated Complement',
        manufacturerCode: 'UPDATED-001',
        brand: 'Updated Brand',
        measureUnit: 'KG',
        ncm: '99999999',
        economicBatch: 'UPDATED-BATCH',
        minimumStock: 10,
        maximumStock: 100,
        warrantyDays: 730,
        weightInKg: 5.5,
        heightInCm: 6.0,
        lengthInCm: 40.0,
        widthInCm: 30.0,
        markup: 50,
        marginB: 40,
        currency: 'USD',
        exchangeRate: 5.5,
        unitCostInCents: 400000,
        unitPriceInCents: 600000,
        ean: '0000000000000',
        additionalInfo: 'Updated Info',
        images: ['new1.jpg', 'new2.jpg'],
        supplierIds: [supplier02.id],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(editedProduct?.type).toBe('Updated Type');
      expect(editedProduct?.group01).toBe('Updated Group 01');
      expect(editedProduct?.group02).toBe('Updated Group 02');
      expect(editedProduct?.description).toBe('Updated Description');
      expect(editedProduct?.complement).toBe('Updated Complement');
      expect(editedProduct?.manufacturerCode).toBe('UPDATED-001');
      expect(editedProduct?.brand).toBe('Updated Brand');
      expect(editedProduct?.measureUnit).toBe('KG');
      expect(editedProduct?.ncm).toBe('99999999');
      expect(editedProduct?.economicBatch).toBe('UPDATED-BATCH');
      expect(editedProduct?.minimumStock).toBe(10);
      expect(editedProduct?.maximumStock).toBe(100);
      expect(editedProduct?.warrantyDays).toBe(730);
      expect(editedProduct?.weightInKg).toBe(5.5);
      expect(editedProduct?.heightInCm).toBe(6.0);
      expect(editedProduct?.lengthInCm).toBe(40.0);
      expect(editedProduct?.widthInCm).toBe(30.0);
      expect(editedProduct?.markup).toBe(50);
      expect(editedProduct?.marginB).toBe(40);
      expect(editedProduct?.currency).toBe('USD');
      expect(editedProduct?.exchangeRate).toBe(5.5);
      expect(editedProduct?.unitCostInCents).toBe(400000);
      expect(editedProduct?.unitPriceInCents).toBe(600000);
      expect(editedProduct?.ean).toBe('0000000000000');
      expect(editedProduct?.additionalInfo).toBe('Updated Info');
      expect(editedProduct?.images).toEqual(['new1.jpg', 'new2.jpg']);
      expect(editedProduct?.suppliers).toHaveLength(1);
      expect(editedProduct?.suppliers[0].id).toBe(supplier02.id);
    });

    it('should edit product multiple times consecutively', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        description: 'Original',
        unitPriceInCents: 100000,
      }));
      await sut.save(product);

      // Act - First edit
      const updated1 = Product.load({
        ...product.props,
        description: 'First Update',
        unitPriceInCents: 200000,
        updatedAt: new Date(),
      });
      await sut.edit(updated1);

      // Act - Second edit
      const updated2 = Product.load({
        ...updated1.props,
        description: 'Second Update',
        unitPriceInCents: 300000,
        updatedAt: new Date(),
      });
      await sut.edit(updated2);

      // Act - Third edit
      const updated3 = Product.load({
        ...updated2.props,
        description: 'Third Update',
        unitPriceInCents: 400000,
        updatedAt: new Date(),
      });
      await sut.edit(updated3);

      // Assert
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(finalProduct?.description).toBe('Third Update');
      expect(finalProduct?.unitPriceInCents).toBe(400000);
    });

    it('should clear images array when editing', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      }));
      await sut.save(product);

      const updatedProduct = Product.load({
        ...product.props,
        images: [],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(editedProduct?.images).toEqual([]);
    });

    it('should preserve createdAt when editing', async() => {
      // Arrange
      const product = Product.create(createProductProps());
      await sut.save(product);

      const originalCreatedAt = (await prisma.product.findUnique({
        where: { id: product.props.id },
      }))?.createdAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedProduct = Product.load({
        ...product.props,
        description: 'Updated',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProduct);

      // Assert
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(editedProduct?.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('delete - edge cases', () => {
    it('should be able to delete multiple products', async() => {
      // Arrange
      const product1 = Product.create(createProductProps({ ean: '1111' }));
      const product2 = Product.create(createProductProps({ ean: '2222' }));
      const product3 = Product.create(createProductProps({ ean: '3333' }));
      await sut.save(product1);
      await sut.save(product2);
      await sut.save(product3);

      // Act
      await sut.delete(product1.props.id);
      await sut.delete(product2.props.id);
      await sut.delete(product3.props.id);

      // Assert
      const remainingProducts = await prisma.product.findMany({
        where: { companyId: company.id },
      });

      expect(remainingProducts).toHaveLength(0);
    });

    it('should allow re-creating product after deletion with same data', async() => {
      // Arrange
      const originalProps = createProductProps({
        description: 'Test Product',
        ean: '7777777777777',
      });
      const product1 = Product.create(originalProps);
      await sut.save(product1);
      await sut.delete(product1.props.id);

      // Act - Create new product with same data (but different ID)
      const product2 = Product.create(originalProps);
      await sut.save(product2);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product2.props.id },
      });

      expect(savedProduct).toBeDefined();
      expect(savedProduct?.description).toBe('Test Product');
      expect(savedProduct?.id).not.toBe(product1.props.id);
      expect(savedProduct?.id).toBe(product2.props.id);
    });
  });

  describe('integration scenarios', () => {
    it('should save and then edit a product', async() => {
      // Arrange
      const product = Product.create(createProductProps());

      // Act - Save
      await sut.save(product);

      // Act - Edit
      const updatedProduct = Product.load({
        ...product.props,
        description: 'Updated via integration test',
        unitPriceInCents: 600000,
        supplierIds: [supplier02.id],
        updatedAt: new Date(),
      });
      await sut.edit(updatedProduct);

      // Assert
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(finalProduct?.description).toBe('Updated via integration test');
      expect(finalProduct?.unitPriceInCents).toBe(600000);
      expect(finalProduct?.suppliers).toHaveLength(1);
      expect(finalProduct?.suppliers[0].id).toBe(supplier02.id);
    });

    it('should save, edit, and then delete a product', async() => {
      // Arrange
      const product = Product.create(createProductProps());

      // Act - Save
      await sut.save(product);

      // Act - Edit
      const updatedProduct = Product.load({
        ...product.props,
        description: 'Will be deleted',
        updatedAt: new Date(),
      });
      await sut.edit(updatedProduct);

      // Verify edit worked
      const editedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });
      expect(editedProduct?.description).toBe('Will be deleted');

      // Act - Delete
      await sut.delete(product.props.id);

      // Assert
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('should handle multiple products operations', async() => {
      // Arrange
      const product1 = Product.create(createProductProps({
        ean: '1111111111111',
        description: 'Product 1',
      }));
      const product2 = Product.create(createProductProps({
        ean: '2222222222222',
        description: 'Product 2',
      }));
      const product3 = Product.create(createProductProps({
        ean: '3333333333333',
        description: 'Product 3',
      }));

      // Act - Save all
      await sut.save(product1);
      await sut.save(product2);
      await sut.save(product3);

      // Act - Edit one
      const updatedProduct2 = Product.load({
        ...product2.props,
        description: 'Product 2 Updated',
        updatedAt: new Date(),
      });
      await sut.edit(updatedProduct2);

      // Act - Delete one
      await sut.delete(product3.props.id);

      // Assert
      const allProducts = await prisma.product.findMany({
        where: { companyId: company.id },
        orderBy: { description: 'asc' },
      });

      expect(allProducts).toHaveLength(2);
      expect(allProducts[0].description).toBe('Product 1');
      expect(allProducts[1].description).toBe('Product 2 Updated');
    });

    it('should handle complete CRUD lifecycle', async() => {
      // Create
      const product = Product.create(createProductProps({
        description: 'CRUD Test Product',
        ean: '8888888888888',
      }));
      await sut.save(product);

      // Read
      const foundProduct = await sut.findById(product.props.id);
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.props.description).toBe('CRUD Test Product');

      // Update
      const updatedProduct = Product.load({
        ...foundProduct!.props,
        description: 'CRUD Test Product - Updated',
        updatedAt: new Date(),
      });
      await sut.edit(updatedProduct);

      const foundUpdated = await sut.findById(product.props.id);
      expect(foundUpdated?.props.description).toBe('CRUD Test Product - Updated');

      // Delete
      await sut.delete(product.props.id);
      const foundDeleted = await sut.findById(product.props.id);
      expect(foundDeleted).toBeNull();
    });

    it('should handle concurrent operations on different products', async() => {
      // Arrange
      const product1 = Product.create(createProductProps({ ean: '1111' }));
      const product2 = Product.create(createProductProps({ ean: '2222' }));
      const product3 = Product.create(createProductProps({ ean: '3333' }));

      // Act - Save all concurrently
      await Promise.all([
        sut.save(product1),
        sut.save(product2),
        sut.save(product3),
      ]);

      // Act - Find all concurrently
      const [found1, found2, found3] = await Promise.all([
        sut.findById(product1.props.id),
        sut.findById(product2.props.id),
        sut.findById(product3.props.id),
      ]);

      // Assert
      expect(found1).toBeDefined();
      expect(found2).toBeDefined();
      expect(found3).toBeDefined();
      expect(found1?.props.id).toBe(product1.props.id);
      expect(found2?.props.id).toBe(product2.props.id);
      expect(found3?.props.id).toBe(product3.props.id);
    });

    it('should enforce uniqueness of EAN + companyId combination', async() => {
      // Arrange
      const product1 = Product.create(createProductProps({
        ean: '7899999999999',
      }));

      await sut.save(product1);

      const product2 = Product.create(createProductProps({
        ean: '7899999999999', // Same EAN as product1
      }));

      // Act & Assert
      expect.assertions(1);
      await expect(sut.save(product2)).rejects.toThrow();
    });

    it('should allow same EAN for different companies', async() => {
      // Arrange
      const company2 = await prisma.company.create({
        data: {
          name: 'Company Test 2',
          fantasyName: 'Company Test Fantasy 2',
          document: '98765432000199',
          ie: 'ie teste 2',
          zipCode: 'zipCode teste 2',
          street: 'street teste 2',
          number: 'number teste 2',
          neighborhood: 'neighborhood teste 2',
          city: 'city teste 2',
          state: 'state teste 2',
          phone01: 'phone01 teste 2',
          email01: 'email01@teste2.com',
          active: true,
        },
      });

      const product1 = Product.create(createProductProps({
        companyId: company.id,
        ean: '7899888777666',
      }));

      const product2 = Product.create(createProductProps({
        companyId: company2.id,
        ean: '7899888777666', // Same EAN but different company
      }));

      // Act
      await sut.save(product1);
      await sut.save(product2);

      // Assert
      const savedProduct1 = await prisma.product.findUnique({
        where: { id: product1.props.id },
      });

      const savedProduct2 = await prisma.product.findUnique({
        where: { id: product2.props.id },
      });

      expect(savedProduct1).toBeDefined();
      expect(savedProduct2).toBeDefined();
      expect(savedProduct1?.ean).toBe('7899888777666');
      expect(savedProduct2?.ean).toBe('7899888777666');
      expect(savedProduct1?.companyId).toBe(company.id);
      expect(savedProduct2?.companyId).toBe(company2.id);
    });

    it('should save and retrieve product with all currency types', async() => {
      // Arrange
      const currencies = ['BRL', 'USD', 'EUR'];
      const products = currencies.map((currency, index) =>
        Product.create(createProductProps({
          ean: `CURR${index}${Date.now()}`,
          currency,
          exchangeRate: currency === 'BRL' ? 1.0 : 5.5,
        })),
      );

      // Act
      await Promise.all(products.map(p => sut.save(p)));

      // Assert
      for (let i = 0; i < products.length; i++) {
        const saved = await prisma.product.findUnique({
          where: { id: products[i].props.id },
        });
        expect(saved?.currency).toBe(currencies[i]);
      }
    });

    it('should maintain data integrity when updating suppliers', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        supplierIds: [supplier01.id],
      }));

      await sut.save(product);

      // Act - Update product with different suppliers
      const updatedProduct = Product.load({
        ...product.props,
        supplierIds: [supplier02.id],
      });

      await sut.edit(updatedProduct);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
        include: { suppliers: true },
      });

      expect(savedProduct?.suppliers).toHaveLength(1);
      expect(savedProduct?.suppliers[0].id).toBe(supplier02.id);
    });

    it('should handle products with empty string fields', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        complement: '',
        additionalInfo: '',
        manufacturerCode: '',
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.complement).toBe('');
      expect(savedProduct?.additionalInfo).toBe('');
      expect(savedProduct?.manufacturerCode).toBe('');
    });

    it('should preserve exact decimal precision for financial values', async() => {
      // Arrange
      const product = Product.create(createProductProps({
        exchangeRate: 5.4732,
        weightInKg: 12.3456,
        markup: 33.33,
        marginB: 25.75,
      }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.exchangeRate).toBeCloseTo(5.4732, 4);
      expect(savedProduct?.weightInKg).toBeCloseTo(12.3456, 4);
      expect(savedProduct?.markup).toBeCloseTo(33.33, 2);
      expect(savedProduct?.marginB).toBeCloseTo(25.75, 2);
    });

    it('should handle product deletion and recreation with same EAN', async() => {
      // Arrange
      const ean = '7899555444333';
      const product1 = Product.create(createProductProps({ ean }));

      await sut.save(product1);
      await sut.delete(product1.props.id);

      const product2 = Product.create(createProductProps({ ean }));

      // Act
      await sut.save(product2);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product2.props.id },
      });

      expect(savedProduct).toBeDefined();
      expect(savedProduct?.ean).toBe(ean);
      expect(savedProduct?.id).toBe(product2.props.id);
      expect(savedProduct?.id).not.toBe(product1.props.id);
    });

    it('should validate image URLs are preserved correctly', async() => {
      // Arrange
      const images = [
        'https://example.com/product/image1.jpg',
        'https://cdn.example.com/images/product-2.png',
        'https://storage.example.com/media/product_3.webp',
      ];
      const product = Product.create(createProductProps({ images }));

      // Act
      await sut.save(product);

      // Assert
      const savedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedProduct?.images).toHaveLength(3);
      expect(savedProduct?.images).toEqual(images);
      images.forEach((image, index) => {
        expect(savedProduct?.images[index]).toBe(image);
      });
    });
  });
});
