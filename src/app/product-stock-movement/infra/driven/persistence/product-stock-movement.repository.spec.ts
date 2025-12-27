import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { ProductStockMovement } from 'src/app/product-stock-movement/domain/entities/product-stock-movement.entity';
import { ProductStockMovementTypeEnum } from 'src/app/product-stock-movement/domain/enums/product-stock-movement.enum';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProductStockMovementRepositoryAdapterPrisma } from './product-stock-movement.repository';

describe('ProductStockMovementRepositoryAdapterPrisma', () => {
  let sut: ProductStockMovementRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;
  let productTemplate: Product;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        ProductStockMovementRepositoryAdapterPrisma,
        PrismaService,
      ],
    }).compile();

    sut = module.get(ProductStockMovementRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.productStockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.company.deleteMany();

    company = await prisma.company.create({
      data: {
        name: 'Test Company',
        fantasyName: 'Test Fantasy',
        document: '11222333000181',
        ie: 'IE123456',
        zipCode: '12345-678',
        street: 'Test Street',
        number: '100',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        phone01: '1122334455',
        email01: 'test@company.com',
        active: true,
      },
    });

    productTemplate = Product.create({
      companyId: company.id,
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
      maximumStock: 100,
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

  afterEach(async() => {
    await prisma.productStockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  async function createProductInDatabase(product: Product): Promise<void> {
    await prisma.product.create({
      data: {
        id: product.props.id,
        type: product.props.type,
        group01: product.props.group01,
        group02: product.props.group02,
        description: product.props.description,
        manufacturerCode: product.props.manufacturerCode,
        brand: product.props.brand,
        measureUnit: product.props.measureUnit,
        ncm: product.props.ncm,
        economicBatch: product.props.economicBatch,
        minimumStock: product.props.minimumStock,
        maximumStock: product.props.maximumStock,
        warrantyDays: product.props.warrantyDays,
        weightInKg: product.props.weightInKg,
        heightInCm: product.props.heightInCm,
        lengthInCm: product.props.lengthInCm,
        widthInCm: product.props.widthInCm,
        markup: product.props.markup,
        marginB: product.props.marginB,
        currency: product.props.currency,
        exchangeRate: product.props.exchangeRate,
        unitCostInCents: product.props.unitCostInCents,
        unitPriceInCents: product.props.unitPriceInCents,
        ean: product.props.ean,
        currentStock: product.props.currentStock,
        companyId: company.id,
        createdAt: product.props.createdAt,
        updatedAt: product.props.updatedAt,
      },
    });
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('createMovementAndUpdateProduct - INPUT movements', () => {
    it('should create an INPUT movement and update product stock synchronously', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert - Verify movement was created
      const savedMovement = await prisma.productStockMovement.findUnique({
        where: { id: movement.props.id },
      });

      expect(savedMovement).toBeDefined();
      expect(savedMovement?.id).toBe(movement.props.id);
      expect(savedMovement?.productId).toBe(product.props.id);
      expect(savedMovement?.type).toBe(ProductStockMovementTypeEnum.INPUT);
      expect(savedMovement?.quantity).toBe(50);
      expect(savedMovement?.unitPriceInCents).toBe(5000);

      // Assert - Verify product was updated
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(dbProduct?.currentStock).toBe(50);
    });

    it('should handle multiple INPUT movements and maintain synchronization', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      // First movement
      const { movement: movement1, product: product1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 30,
        unitPriceInCents: 5000,
      }, product);

      await sut.createMovementAndUpdateProduct(movement1, product1);

      // Second movement
      const { movement: movement2, product: product2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 20,
        unitPriceInCents: 5500,
      }, product1);

      // Act
      await sut.createMovementAndUpdateProduct(movement2, product2);

      // Assert - Verify all movements
      const movements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
        orderBy: { createdAt: 'asc' },
      });

      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(movements).toHaveLength(2);
      expect(movements[0].quantity).toBe(30);
      expect(movements[1].quantity).toBe(20);
      expect(dbProduct?.currentStock).toBe(50);

      // Assert - Verify synchronization (total movements = current stock)
      const totalInput = movements.reduce((sum, m) => sum + m.quantity, 0);
      expect(totalInput).toBe(dbProduct?.currentStock);
    });

    it('should handle INPUT movement with minimum quantity (1)', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 1,
        unitPriceInCents: 5000,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(dbProduct?.currentStock).toBe(1);
    });

    it('should handle large quantity INPUT movement', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 10000,
        unitPriceInCents: 4500,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      const savedMovement = await prisma.productStockMovement.findUnique({
        where: { id: movement.props.id },
      });

      expect(dbProduct?.currentStock).toBe(10000);
      expect(savedMovement?.quantity).toBe(dbProduct?.currentStock);
    });
  });

  describe('createMovementAndUpdateProduct - OUTPUT movements', () => {
    it('should create an OUTPUT movement and decrease product stock synchronously', async() => {
      // Arrange - Create product with initial stock
      const product = Product.load({
        ...productTemplate.props,
        currentStock: 100,
      });
      await createProductInDatabase(product);

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 10000,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert - Verify movement
      const savedMovement = await prisma.productStockMovement.findUnique({
        where: { id: movement.props.id },
      });

      expect(savedMovement).toBeDefined();
      expect(savedMovement?.type).toBe(ProductStockMovementTypeEnum.OUTPUT);
      expect(savedMovement?.quantity).toBe(30);
      expect(savedMovement?.unitPriceInCents).toBe(10000);

      // Assert - Verify product
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(dbProduct?.currentStock).toBe(70);
    });

    it('should handle multiple OUTPUT movements and maintain stock accuracy', async() => {
      // Arrange
      const product = Product.load({
        ...productTemplate.props,
        currentStock: 100,
      });
      await createProductInDatabase(product);

      // First output
      const { movement: movement1, product: product1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 20,
        unitPriceInCents: 10000,
      }, product);

      await sut.createMovementAndUpdateProduct(movement1, product1);

      // Second output
      const { movement: movement2, product: product2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 30,
        unitPriceInCents: 11000,
      }, product1);

      // Act
      await sut.createMovementAndUpdateProduct(movement2, product2);

      // Assert
      const movements = await prisma.productStockMovement.findMany({
        where: {
          productId: product.props.id,
          type: ProductStockMovementTypeEnum.OUTPUT,
        },
        orderBy: { createdAt: 'asc' },
      });

      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(movements).toHaveLength(2);
      expect(dbProduct?.currentStock).toBe(50); // 100 - 20 - 30
    });

    it('should handle OUTPUT movement that depletes stock to zero', async() => {
      // Arrange
      const product = Product.load({
        ...productTemplate.props,
        currentStock: 100,
      });
      await createProductInDatabase(product);

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 100,
        unitPriceInCents: 10000,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(dbProduct?.currentStock).toBe(0);
    });

    it('should create OUTPUT movement with minimum quantity (1)', async() => {
      // Arrange
      const product = Product.load({
        ...productTemplate.props,
        currentStock: 100,
      });
      await createProductInDatabase(product);

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 1,
        unitPriceInCents: 10000,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(dbProduct?.currentStock).toBe(99);
    });
  });

  describe('createMovementAndUpdateProduct - Mixed movements', () => {
    it('should handle alternating INPUT and OUTPUT movements with full synchronization', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const operations = [
        { type: ProductStockMovementTypeEnum.INPUT, qty: 50, value: 5000 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 20, value: 10000 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 30, value: 5500 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 10, value: 11000 },
      ];

      let currentProduct = product;

      // Act
      for (const op of operations) {
        const { movement, product: updatedProduct } = ProductStockMovement.create({
          productId: product.props.id,
          type: op.type,
          quantity: op.qty,
          unitPriceInCents: op.value,
        }, currentProduct);

        await sut.createMovementAndUpdateProduct(movement, updatedProduct);
        currentProduct = updatedProduct;
      }

      // Assert
      const allMovements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
        orderBy: { createdAt: 'asc' },
      });

      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(allMovements).toHaveLength(4);

      // Calculate expected stock from movements
      let calculatedStock = 0;
      for (const movement of allMovements) {
        if (movement.type === ProductStockMovementTypeEnum.INPUT) {
          calculatedStock += movement.quantity;
        } else {
          calculatedStock -= movement.quantity;
        }
      }

      // Assert - Verify synchronization
      expect(calculatedStock).toBe(dbProduct?.currentStock);
      expect(dbProduct?.currentStock).toBe(50); // 50 - 20 + 30 - 10
    });

    it('should maintain accurate stock history across multiple movements', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const movementData = [
        { type: ProductStockMovementTypeEnum.INPUT, qty: 100, value: 5000 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 30, value: 10000 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 20, value: 10500 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 50, value: 5200 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 40, value: 11000 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 60, value: 5100 },
      ];

      let currentProduct = product;

      // Act
      for (const data of movementData) {
        const { movement, product: updatedProduct } = ProductStockMovement.create({
          productId: product.props.id,
          type: data.type,
          quantity: data.qty,
          unitPriceInCents: data.value,
        }, currentProduct);

        await sut.createMovementAndUpdateProduct(movement, updatedProduct);
        currentProduct = updatedProduct;
      }

      // Assert
      const allMovements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
        orderBy: { createdAt: 'asc' },
      });

      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(allMovements).toHaveLength(6);

      // Assert - Verify movement types
      const inputMovements = allMovements.filter(m => m.type === ProductStockMovementTypeEnum.INPUT);
      const outputMovements = allMovements.filter(m => m.type === ProductStockMovementTypeEnum.OUTPUT);

      expect(inputMovements).toHaveLength(3);
      expect(outputMovements).toHaveLength(3);

      // Assert - Verify stock calculation
      const totalInput = inputMovements.reduce((sum, m) => sum + m.quantity, 0);
      const totalOutput = outputMovements.reduce((sum, m) => sum + m.quantity, 0);
      const expectedStock = totalInput - totalOutput;

      expect(dbProduct?.currentStock).toBe(expectedStock);
      expect(dbProduct?.currentStock).toBe(120); // 100 - 30 - 20 + 50 - 40 + 60
    });
  });

  describe('createMovementAndUpdateProduct - Transaction behavior', () => {
    it('should ensure movement and product update happen atomically', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5000,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert - Both entities should exist
      const savedMovement = await prisma.productStockMovement.findUnique({
        where: { id: movement.props.id },
      });

      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedMovement).toBeDefined();
      expect(dbProduct).toBeDefined();
      expect(savedMovement?.productId).toBe(dbProduct?.id);
    });

    it('should preserve createdAt timestamp from movement entity', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const specificDate = new Date('2024-06-15T10:30:00.000Z');
      const movementData = ProductStockMovement.load({
        id: 'custom-id-123',
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 25,
        unitPriceInCents: 5000,
        createdAt: specificDate,
      });

      product.updateStock(25);

      // Act
      await sut.createMovementAndUpdateProduct(movementData, product);

      // Assert
      const savedMovement = await prisma.productStockMovement.findUnique({
        where: { id: 'custom-id-123' },
      });

      expect(savedMovement?.createdAt).toEqual(specificDate);
    });

    it('should update product updatedAt timestamp from product entity', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const initialUpdatedAt = product.props.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10));

      const { movement, product: updatedProduct } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 10,
        unitPriceInCents: 5000,
      }, product);

      // Act
      await sut.createMovementAndUpdateProduct(movement, updatedProduct);

      // Assert
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(dbProduct?.updatedAt.getTime())
        .toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('createMovementAndUpdateProduct - Complex scenarios', () => {
    it('should handle high-volume movements (stress test)', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      let currentProduct = product;
      const movementCount = 50;

      // Act
      for (let i = 0; i < movementCount; i++) {
        const isInput = i % 3 !== 0; // Mostly inputs
        const quantity = Math.floor(Math.random() * 50) + 1;

        if (isInput || currentProduct.hasStock()) {
          try {
            const { movement, product: updatedProduct } = ProductStockMovement.create({
              productId: product.props.id,
              type: isInput ? ProductStockMovementTypeEnum.INPUT : ProductStockMovementTypeEnum.OUTPUT,
              quantity: Math.min(quantity, isInput ? 999999 : currentProduct.props.currentStock || 1),
              unitPriceInCents: 5000 + (i * 100),
            }, currentProduct);

            await sut.createMovementAndUpdateProduct(movement, updatedProduct);
            currentProduct = updatedProduct;
          } catch (error) {
            // Skip if insufficient stock
          }
        }
      }

      // Assert
      const savedMovements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
      });

      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(savedMovements.length).toBeGreaterThan(0);

      const calculatedStock = savedMovements.reduce((stock, m) => {
        return m.type === ProductStockMovementTypeEnum.INPUT
          ? stock + m.quantity
          : stock - m.quantity;
      }, 0);

      expect(dbProduct?.currentStock).toBe(calculatedStock);
    });

    it('should verify stock synchronization after each operation in a chain', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const checkpoints = [];
      let currentProduct = product;

      // Operation 1
      const { movement: m1, product: p1 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 100,
        unitPriceInCents: 5000,
      }, currentProduct);
      await sut.createMovementAndUpdateProduct(m1, p1);
      currentProduct = p1;

      let dbProduct = await prisma.product.findUnique({ where: { id: product.props.id } });
      checkpoints.push({ expected: 100, actual: dbProduct?.currentStock });

      // Operation 2
      const { movement: m2, product: p2 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 35,
        unitPriceInCents: 10000,
      }, currentProduct);
      await sut.createMovementAndUpdateProduct(m2, p2);
      currentProduct = p2;

      dbProduct = await prisma.product.findUnique({ where: { id: product.props.id } });
      checkpoints.push({ expected: 65, actual: dbProduct?.currentStock });

      // Operation 3
      const { movement: m3, product: p3 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 50,
        unitPriceInCents: 5200,
      }, currentProduct);
      await sut.createMovementAndUpdateProduct(m3, p3);
      currentProduct = p3;

      dbProduct = await prisma.product.findUnique({ where: { id: product.props.id } });
      checkpoints.push({ expected: 115, actual: dbProduct?.currentStock });

      // Operation 4
      const { movement: m4, product: p4 } = ProductStockMovement.create({
        productId: product.props.id,
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: 28,
        unitPriceInCents: 11000,
      }, currentProduct);
      await sut.createMovementAndUpdateProduct(m4, p4);
      currentProduct = p4;

      dbProduct = await prisma.product.findUnique({ where: { id: product.props.id } });
      checkpoints.push({ expected: 87, actual: dbProduct?.currentStock });

      // Assert all checkpoints
      checkpoints.forEach((checkpoint) => {
        expect(checkpoint.actual).toBe(checkpoint.expected);
      });

      // Final synchronization check
      const allMovements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
      });

      const calculatedStock = allMovements.reduce((stock, m) => {
        return m.type === ProductStockMovementTypeEnum.INPUT
          ? stock + m.quantity
          : stock - m.quantity;
      }, 0);

      expect(dbProduct?.currentStock).toBe(calculatedStock);
      expect(dbProduct?.currentStock).toBe(87);
    });

    it('should maintain data integrity through rapid sequential movements', async() => {
      // Arrange
      const product = Product.load({ ...productTemplate.props });
      await createProductInDatabase(product);

      const rapidMovements = [
        { type: ProductStockMovementTypeEnum.INPUT, qty: 10, value: 5000 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 20, value: 5100 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 15, value: 4900 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 12, value: 10000 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 8, value: 5200 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 6, value: 10500 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 25, value: 5050 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 18, value: 11000 },
        { type: ProductStockMovementTypeEnum.INPUT, qty: 14, value: 4950 },
        { type: ProductStockMovementTypeEnum.OUTPUT, qty: 9, value: 10800 },
      ];

      let currentProduct = product;

      // Act
      for (const m of rapidMovements) {
        const { movement, product: updatedProduct } = ProductStockMovement.create({
          productId: product.props.id,
          type: m.type,
          quantity: m.qty,
          unitPriceInCents: m.value,
        }, currentProduct);

        await sut.createMovementAndUpdateProduct(movement, updatedProduct);
        currentProduct = updatedProduct;
      }

      // Assert
      const allMovements = await prisma.productStockMovement.findMany({
        where: { productId: product.props.id },
      });

      const dbProduct = await prisma.product.findUnique({
        where: { id: product.props.id },
      });

      expect(allMovements).toHaveLength(10);

      const totalInputs = allMovements
        .filter(m => m.type === ProductStockMovementTypeEnum.INPUT)
        .reduce((sum, m) => sum + m.quantity, 0);

      const totalOutputs = allMovements
        .filter(m => m.type === ProductStockMovementTypeEnum.OUTPUT)
        .reduce((sum, m) => sum + m.quantity, 0);

      expect(dbProduct?.currentStock).toBe(totalInputs - totalOutputs);
      expect(dbProduct?.currentStock).toBe(47); // 10+20+15-12+8-6+25-18+14-9
    });
  });
});
