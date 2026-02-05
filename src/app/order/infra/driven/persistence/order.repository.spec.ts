import { Test, TestingModule } from '@nestjs/testing';
import { CreateBudget } from 'src/app/budget/application/usecases/create-budget/create-budget.service';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { IOrderRepository } from 'src/app/order/application/persistence/repository/order-repository.interface';
import { Order } from 'src/app/order/domain/entities/order.entity';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { OrderModule } from 'src/app/order/order.module';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

describe('OrderRepository', () => {
  let orderRepo: IOrderRepository;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createProduct: CreateProduct;
  let createService: CreateService;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let companyId: string;
  let clientId: string;
  let sellerId: string;
  let product01Id: string;
  let product02Id: string;
  let serviceId: string;
  const accountId = 'account-admin-id';

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        OrderModule,
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    orderRepo = module.get(TOKENS.OrderRepository);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);

    await prisma.truncate();

    // Create company
    companyId = (await createCompany.execute({
      name: 'Company Test',
      fantasyName: 'Company Fantasy Test',
      document: '61067756000142',
      ie: 'ie teste',
      zipCode: '12345-678',
      street: 'Street Test',
      number: '123',
      neighborhood: 'Neighborhood Test',
      complement: null,
      reference: null,
      city: 'City Test',
      state: 'ST',
      cellphone: '11999999999',
      phone01: '1133333333',
      phone02: null,
      email01: 'company@test.com',
      email02: null,
    })).id;

    // Create client
    clientId = (await createClient.execute({
      kind: 'Cliente Tipo 1',
      cnpj: '11222333000181',
      ie: '123456789',
      group: 'Grupo Cliente',
      type: 'Tipo Cliente',
      generateInvoice: true,
      companyName: 'Client Company',
      fantasyName: 'Client Fantasy',
      owner: 'Owner',
      headquarters: 'Headquarters',
      companyIds: [companyId],
    })).id;

    // Create seller
    sellerId = (await createSeller.execute({
      name: 'Seller',
      nickname: 'Seller Nick',
      phone: '1133333333',
      cellphone: '11999999999',
      email: 'seller@test.com',
      password: 'password123',
      commission: 5,
      zipCode: '12345-678',
      street: 'Seller Street',
      number: '456',
      complement: null,
      reference: null,
      neighborhood: 'Seller Neighborhood',
      city: 'Seller City',
      state: 'SC',
      observation: null,
      companyIds: [companyId],
    })).id;

    // Create supplier and product
    const supplierId = (await createSupplier.execute({
      cnpj: '45402242000140',
      ie: '111222333',
      group: 'Supplier Group',
      type: 'Nacional',
      companyName: 'Supplier Company',
      fantasyName: 'Supplier Fantasy',
      representative: 'Supplier Rep',
      companyIds: [companyId],
    })).id;

    product01Id = (await createProduct.execute({
      companyId,
      type: 'Product Type',
      group01: 'Group 01',
      group02: 'Group 02',
      description: 'Product Test',
      complement: null,
      manufacturerCode: 'MANUF001',
      brand: 'Brand Test',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH001',
      minimumStock: 5,
      maximumStock: 100,
      warrantyDays: 365,
      weightInKg: 1.5,
      heightInCm: 10,
      lengthInCm: 20,
      widthInCm: 15,
      markup: 30,
      marginB: 20,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 1500,
      ean: '7891234567890',
      additionalInfo: null,
      supplierIds: [supplierId],
      images: [],
    })).id;

    product02Id = (await createProduct.execute({
      companyId,
      type: 'Product Type',
      group01: 'Group 01',
      group02: 'Group 02',
      description: 'Product Test 2',
      complement: null,
      manufacturerCode: 'MANUF002',
      brand: 'Brand Test 2',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH002',
      minimumStock: 5,
      maximumStock: 100,
      warrantyDays: 365,
      weightInKg: 1.5,
      heightInCm: 10,
      lengthInCm: 20,
      widthInCm: 15,
      markup: 30,
      marginB: 20,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 1500,
      ean: '7891234567891',
      additionalInfo: null,
      supplierIds: [supplierId],
      images: [],
    })).id;

    await prisma.product.update({
      where: { id: product01Id },
      data: { currentStock: 100 },
    });

    // Create service
    const serviceCategoryId = (await prisma.serviceCategory.create({
      data: {
        name: 'Service Category Test',
      },
    })).id;

    serviceId = (await createService.execute({
      name: 'Service Test',
      nickname: null,
      companyId,
      categoryId: serviceCategoryId,
      deadline: null,
      shippingValueInCents: null,
      warrant: null,
      weight: null,
      maxVolume: null,
      dimensions: null,
      commission: 10,
      valueInCents: 5000,
      description: null,
      productIds: [product01Id, product02Id],
    })).id;
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(orderRepo).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });

      // Act
      await orderRepo.save(order);

      // Assert
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.props.id },
      });

      expect(orderInDb).toBeDefined();
      expect(orderInDb?.id).toBe(order.props.id);
      expect(orderInDb?.budgetId).toBe(budget.id);
      expect(orderInDb?.status).toBe(OrderStatus.CREATED);
      expect(orderInDb?.createdBy).toBe(accountId);
    });

    it('should persist statusHistory as JSON', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });

      // Act
      await orderRepo.save(order);

      // Assert
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.props.id },
      });

      expect(orderInDb?.statusHistory).toBeDefined();
      const history = JSON.parse(JSON.stringify(orderInDb?.statusHistory));
      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe(OrderStatus.CREATED);
      expect(history[0].changedBy).toBe(accountId);
    });
  });

  describe('edit', () => {
    it('should update order status', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      order.startProduction(accountId, 'Iniciando produção');
      await orderRepo.edit(order);

      // Assert
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.props.id },
      });

      expect(orderInDb?.status).toBe(OrderStatus.PRODUCTION);
    });

    it('should update statusHistory on edit', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      order.startProduction(accountId);
      order.markAsInvoiced(accountId, 'NF-e emitida');
      await orderRepo.edit(order);

      // Assert
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.props.id },
      });

      const history = JSON.parse(JSON.stringify(orderInDb?.statusHistory));
      expect(history).toHaveLength(3);
      expect(history[0].status).toBe(OrderStatus.CREATED);
      expect(history[1].status).toBe(OrderStatus.PRODUCTION);
      expect(history[2].status).toBe(OrderStatus.INVOICED);
      expect(history[2].observation).toBe('NF-e emitida');
    });

    it('should update trackingCode on ship', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      order.startProduction(accountId);
      order.markAsInvoiced(accountId);
      order.ship(accountId, 'BR123456789');
      await orderRepo.edit(order);

      // Assert
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.props.id },
      });

      expect(orderInDb?.trackingCode).toBe('BR123456789');
      expect(orderInDb?.status).toBe(OrderStatus.SHIPPED);
    });

    it('should update cancellation data on cancel', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      order.cancel(accountId, 'Cliente desistiu');
      await orderRepo.edit(order);

      // Assert
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.props.id },
      });

      expect(orderInDb?.status).toBe(OrderStatus.CANCELLED);
      expect(orderInDb?.cancelledAt).toBeInstanceOf(Date);
      expect(orderInDb?.cancelledBy).toBe(accountId);
      expect(orderInDb?.cancellationReason).toBe('Cliente desistiu');
    });
  });

  describe('findById', () => {
    it('should return null when order does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await orderRepo.findById(nonExistentId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return hydrated Order entity', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      const result = await orderRepo.findById(order.props.id);

      // Assert
      expect(result).toBeInstanceOf(Order);
      expect(result?.props.id).toBe(order.props.id);
      expect(result?.props.budgetId).toBe(budget.id);
      expect(result?.props.status).toBe(OrderStatus.CREATED);
    });

    it('should hydrate statusHistory as Value Objects', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      order.startProduction(accountId, 'Iniciando');
      await orderRepo.save(order);

      // Act
      const result = await orderRepo.findById(order.props.id);

      // Assert
      expect(result?.statusHistory).toHaveLength(2);
      expect(result?.statusHistory[0].status).toBe(OrderStatus.CREATED);
      expect(result?.statusHistory[1].status).toBe(OrderStatus.PRODUCTION);
      expect(result?.statusHistory[1].observation).toBe('Iniciando');
    });

    it('should allow entity manipulation after loading', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      const loadedOrder = await orderRepo.findById(order.props.id);
      loadedOrder?.startProduction(accountId);
      await orderRepo.edit(loadedOrder!);

      // Assert
      const updatedOrder = await orderRepo.findById(order.props.id);
      expect(updatedOrder?.props.status).toBe(OrderStatus.PRODUCTION);
      expect(updatedOrder?.statusHistory).toHaveLength(2);
    });
  });

  describe('findByBudgetId', () => {
    it('should return null when no order exists for budget', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      // Act
      const result = await orderRepo.findByBudgetId(budget.id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return order by budgetId', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      const result = await orderRepo.findByBudgetId(budget.id);

      // Assert
      expect(result).toBeInstanceOf(Order);
      expect(result?.props.id).toBe(order.props.id);
      expect(result?.props.budgetId).toBe(budget.id);
    });

    it('should return the correct order when multiple budgets exist', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product 1',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const budget2 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Test Service 1',
            quantity: 5,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      });

      const order1 = Order.create({ budgetId: budget1.id, createdBy: accountId });
      const order2 = Order.create({ budgetId: budget2.id, createdBy: accountId });
      await orderRepo.save(order1);
      await orderRepo.save(order2);

      // Act
      const result1 = await orderRepo.findByBudgetId(budget1.id);
      const result2 = await orderRepo.findByBudgetId(budget2.id);

      // Assert
      expect(result1?.props.id).toBe(order1.props.id);
      expect(result2?.props.id).toBe(order2.props.id);
      expect(result1?.props.budgetId).toBe(budget1.id);
      expect(result2?.props.budgetId).toBe(budget2.id);
    });
  });

  describe('integration with entity', () => {
    it('should persist and load complete workflow', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      // Act - criar order
      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Avançar status
      const loadedOrder1 = await orderRepo.findById(order.props.id);
      loadedOrder1?.startProduction(accountId, 'Produção iniciada');
      await orderRepo.edit(loadedOrder1!);

      const loadedOrder2 = await orderRepo.findById(order.props.id);
      loadedOrder2?.markAsInvoiced(accountId, 'NF-e 12345');
      await orderRepo.edit(loadedOrder2!);

      const loadedOrder3 = await orderRepo.findById(order.props.id);
      loadedOrder3?.ship(accountId, 'BR987654321', 'Enviado pela transportadora X');
      await orderRepo.edit(loadedOrder3!);

      const loadedOrder4 = await orderRepo.findById(order.props.id);
      loadedOrder4?.deliver(accountId, 'Entregue ao cliente');
      await orderRepo.edit(loadedOrder4!);

      // Assert - carregar order final
      const finalOrder = await orderRepo.findById(order.props.id);
      expect(finalOrder?.props.status).toBe(OrderStatus.DELIVERED);
      expect(finalOrder?.props.trackingCode).toBe('BR987654321');
      expect(finalOrder?.statusHistory).toHaveLength(5);
      expect(finalOrder?.statusHistory[4].status).toBe(OrderStatus.DELIVERED);
      expect(finalOrder?.statusHistory[4].observation).toBe('Entregue ao cliente');
    });

    it('should persist cancellation correctly', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      const loadedOrder = await orderRepo.findById(order.props.id);
      loadedOrder?.startProduction(accountId);
      loadedOrder?.cancel(accountId, 'Problema na produção');
      await orderRepo.edit(loadedOrder!);

      // Assert
      const cancelledOrder = await orderRepo.findById(order.props.id);
      expect(cancelledOrder?.props.status).toBe(OrderStatus.CANCELLED);
      expect(cancelledOrder?.props.cancelledAt).toBeInstanceOf(Date);
      expect(cancelledOrder?.props.cancelledBy).toBe(accountId);
      expect(cancelledOrder?.props.cancellationReason).toBe('Problema na produção');
      expect(cancelledOrder?.statusHistory).toHaveLength(3);
    });
  });
});
