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

    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

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
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();
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
      await prisma.stockMovement.createMany({
        data: [
          {
            productId: product.props.id,
            type: 'ENTRY',
            quantity: 10,
            unitValue: 35000,
          },
          {
            productId: product.props.id,
            type: 'EXIT',
            quantity: 5,
            unitValue: 35000,
          },
        ],
      });

      // Verify stock movements exist
      const movements = await prisma.stockMovement.findMany({
        where: { productId: product.props.id },
      });
      expect(movements).toHaveLength(2);

      // Act
      await sut.delete(product.props.id);

      // Assert - Product and its movements should be deleted (cascade)
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });
      const deletedMovements = await prisma.stockMovement.findMany({
        where: { productId: product.props.id },
      });

      expect(deletedProduct).toBeNull();
      expect(deletedMovements).toHaveLength(0);
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
  });
});
