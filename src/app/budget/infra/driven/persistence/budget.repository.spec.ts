import { Test } from '@nestjs/testing';
import { Client, Company, Product, Seller, Service, Shipper } from '@prisma/client';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { BudgetPersistenceModule } from 'src/app/budget/application/persistence/budget-persistence.module';
import { BudgetItem } from 'src/app/budget/domain/entities/budget-item.entity';
import { Budget } from 'src/app/budget/domain/entities/budget.entity';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BudgetRepositoryAdapterPrisma } from './budget.repository';

describe('BudgetRepositoryAdapterPrisma', () => {
  let sut: BudgetRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;
  let client: Client;
  let seller: Seller;
  let shipper: Shipper;
  let product: Product;
  let service: Service;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        BudgetPersistenceModule,
        ConfigModule,
      ],
      providers: [
        BudgetRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(BudgetRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.item.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.license.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.address.deleteMany();
    await prisma.productStockMovement.deleteMany();
    await prisma.serviceProduct.deleteMany();
    await prisma.product.deleteMany();
    await prisma.service.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.shipper.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.client.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.role.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();

    // Create test data
    company = await prisma.company.create({
      data: {
        name: 'Test Company',
        fantasyName: 'Test Fantasy',
        document: '11222333000181',
        ie: 'IE123456',
        zipCode: '12345000',
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TS',
        phone01: '1234567890',
        email01: 'test@test.com',
        active: true,
      },
    });

    client = await prisma.client.create({
      data: {
        id: 'client-01',
        kind: 'Kind A',
        cnpj: '33444555000172',
        ie: '111222333',
        type: 'Type A',
        group: 'Group A',
        companyName: 'Client Company 01',
        fantasyName: 'Client Fantasy 01',
        owner: 'Owner 01',
        headquarters: 'HQ 01',
        generateInvoice: true,
        active: true,
        companies: { connect: { id: company.id } },
      },
    });

    seller = await prisma.seller.create({
      data: {
        id: 'seller-01',
        name: 'Seller 01',
        phone: '11999999999',
        cellphone: '11999999999',
        commission: 5.0,
        zipCode: '12345-678',
        street: 'Main Street',
        number: '100',
        neighborhood: 'Downtown',
        city: 'São Paulo',
        state: 'SP',
        active: true,
        role: {
          create: {
            role: AccountRole.SELLER,
            account: {
              create: {
                email: 'seller01@test.com',
                password: 'hashed_password_1',
                status: AccountStatus.ACTIVE,
              },
            },
          },
        },
        companies: { connect: { id: company.id } },
      },
    });

    shipper = await prisma.shipper.create({
      data: {
        id: 'shipper-01',
        companyName: 'Shipper Company 01',
        fantasyName: 'Shipper Fantasy 01',
        cnpj: '55666777000194',
        contact: 'contact@shipper01.com',
        representative: 'Rep 01',
        zipCode: '12345-678',
        street: 'Shipper Street',
        number: '300',
        neighborhood: 'Industrial',
        city: 'São Paulo',
        state: 'SP',
        active: true,
        companies: { connect: { id: company.id } },
      },
    });

    product = await prisma.product.create({
      data: {
        id: 'product-01',
        type: 'Type A',
        group01: 'Group01',
        group02: 'Group02',
        description: 'Product Description',
        manufacturerCode: 'MAN-001',
        brand: 'Brand A',
        measureUnit: 'UN',
        ncm: '12345678',
        economicBatch: '100',
        minimumStock: 10,
        maximumStock: 100,
        warrantyDays: 365,
        weightInKg: 1.5,
        heightInCm: 10,
        lengthInCm: 20,
        widthInCm: 15,
        markup: 1.5,
        marginB: 0.3,
        currency: 'BRL',
        exchangeRate: 1.0,
        unitCostInCents: 10000,
        unitPriceInCents: 15000,
        ean: 'EAN-001',
        images: [],
        currentStock: 50,
        companyId: company.id,
      },
    });

    const category = await prisma.serviceCategory.create({
      data: {
        name: 'Category 01',
        active: true,
      },
    });

    service = await prisma.service.create({
      data: {
        id: 'service-01',
        name: 'Service 01',
        companyId: company.id,
        categoryId: category.id,
        commission: 5.0,
        valueInCents: 20000,
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.item.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.license.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.address.deleteMany();
    await prisma.productStockMovement.deleteMany();
    await prisma.serviceProduct.deleteMany();
    await prisma.product.deleteMany();
    await prisma.service.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.shipper.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.client.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.role.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();
  });

  describe('findById', () => {
    it('should return null when budget is not found', async() => {
      // Act
      const result = await sut.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return budget with all fields correctly loaded', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'CIF',
        shipperId: shipper.id,
        freightValueInCents: 5000,
        subtotalInCents: 0, // Will be calculated
        discountInCents: 1000,
        totalInCents: 0, // Will be calculated
        commercialProcess: 'PROC-001',
        commercialNote: 'Commercial note',
        observations: 'Test observations',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Product Item',
            quantity: 2,
            unitPriceInCents: 10000,
            discountInCents: 500,
          },
        ],
      });

      await sut.save(budget);

      // Act
      const result = await sut.findById(budget.props.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.props).toEqual(budget.props);
      expect(result?.items).toEqual(budget.items);
    });

    it('should return budget with items correctly loaded', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'CIF',
        shipperId: shipper.id,
        freightValueInCents: 5000,
        subtotalInCents: 0,
        discountInCents: 1000,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Product Item',
            quantity: 2,
            unitPriceInCents: 10000,
            discountInCents: 500,
          },
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId: service.id,
            description: 'Service Item',
            quantity: 1,
            unitPriceInCents: 15000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      // Act
      const result = await sut.findById(budget.props.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.items).toHaveLength(2);

      const firstItem = result?.items[0];
      expect(firstItem?.props.itemType).toBe(BudgetItemType.PRODUCT);
      expect(firstItem?.props.productId).toBe(product.id);
      expect(firstItem?.props.serviceId).toBeNull();
      expect(firstItem?.props.description).toBe('Product Item');
      expect(firstItem?.props.quantity).toBe(2);
      expect(firstItem?.props.unitPriceInCents).toBe(10000);
      expect(firstItem?.props.discountInCents).toBe(500);
      expect(firstItem?.props.subtotalInCents).toBe(19500); // (2 * 10000) - 500

      const secondItem = result?.items[1];
      expect(secondItem?.props.itemType).toBe(BudgetItemType.SERVICE);
      expect(secondItem?.props.productId).toBeNull();
      expect(secondItem?.props.serviceId).toBe(service.id);
      expect(secondItem?.props.description).toBe('Service Item');
      expect(secondItem?.props.quantity).toBe(1);
      expect(secondItem?.props.unitPriceInCents).toBe(15000);
      expect(secondItem?.props.discountInCents).toBe(0);
      expect(secondItem?.props.subtotalInCents).toBe(15000);
    });

    it('should return items ordered by createdAt ascending', async() => {
      // Arrange
      const items = [
        {
          itemType: BudgetItemType.PRODUCT,
          productId: product.id,
          serviceId: null,
          description: 'First Item',
          quantity: 1,
          unitPriceInCents: 10000,
          discountInCents: 0,
        },
        {
          itemType: BudgetItemType.PRODUCT,
          productId: product.id,
          serviceId: null,
          description: 'Second Item',
          quantity: 1,
          unitPriceInCents: 15000,
          discountInCents: 0,
        },
        {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: service.id,
          description: 'Third Item',
          quantity: 1,
          unitPriceInCents: 20000,
          discountInCents: 0,
        },
      ];

      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items,
      });

      await sut.save(budget);

      // Act
      const result = await sut.findById(budget.props.id);

      // Assert
      expect(result?.items).toHaveLength(3);
      expect(result?.items[0].props.description).toBe('First Item');
      expect(result?.items[1].props.description).toBe('Second Item');
      expect(result?.items[2].props.description).toBe('Third Item');
    });
  });

  describe('save', () => {
    it('should save budget in the database', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'CIF',
        shipperId: shipper.id,
        freightValueInCents: 5000,
        subtotalInCents: 0,
        discountInCents: 1000,
        totalInCents: 0,
        commercialProcess: 'PROC-001',
        commercialNote: 'Commercial note',
        observations: 'Test observations',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Product Item',
            quantity: 2,
            unitPriceInCents: 10000,
            discountInCents: 500,
          },
        ],
      });

      // Act
      await sut.save(budget);

      // Assert
      const savedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
      });

      expect(savedBudget).not.toBeNull();
      expect(savedBudget?.id).toBe(budget.props.id);
      expect(savedBudget?.companyId).toBe(company.id);
      expect(savedBudget?.clientId).toBe(client.id);
      expect(savedBudget?.sellerId).toBe(seller.id);
      expect(savedBudget?.freightType).toBe('CIF');
      expect(savedBudget?.shipperId).toBe(shipper.id);
      expect(savedBudget?.freightValueInCents).toBe(5000);
      expect(savedBudget?.subtotalInCents).toBe(19500); // (2 * 10000) - 500
      expect(savedBudget?.discountInCents).toBe(1000);
      expect(savedBudget?.totalInCents).toBe(23500); // 19500 + 5000 - 1000
      expect(savedBudget?.commercialProcess).toBe('PROC-001');
      expect(savedBudget?.commercialNote).toBe('Commercial note');
      expect(savedBudget?.observations).toBe('Test observations');
      expect(savedBudget?.status).toBe(BudgetStatus.PENDING);
    });

    it('should save budget items in the database', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Product Item',
            quantity: 2,
            unitPriceInCents: 10000,
            discountInCents: 500,
          },
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId: service.id,
            description: 'Service Item',
            quantity: 1,
            unitPriceInCents: 15000,
            discountInCents: 0,
          },
        ],
      });

      // Act
      await sut.save(budget);

      // Assert
      const savedItems = await prisma.budgetItem.findMany({
        where: { budgetId: budget.props.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(savedItems).toHaveLength(2);

      expect(savedItems[0].budgetId).toBe(budget.props.id);
      expect(savedItems[0].itemType).toBe(BudgetItemType.PRODUCT);
      expect(savedItems[0].productId).toBe(product.id);
      expect(savedItems[0].serviceId).toBeNull();
      expect(savedItems[0].description).toBe('Product Item');
      expect(savedItems[0].quantity).toBe(2);
      expect(savedItems[0].unitPriceInCents).toBe(10000);
      expect(savedItems[0].discountInCents).toBe(500);
      expect(savedItems[0].subtotalInCents).toBe(19500);

      expect(savedItems[1].budgetId).toBe(budget.props.id);
      expect(savedItems[1].itemType).toBe(BudgetItemType.SERVICE);
      expect(savedItems[1].productId).toBeNull();
      expect(savedItems[1].serviceId).toBe(service.id);
      expect(savedItems[1].description).toBe('Service Item');
      expect(savedItems[1].quantity).toBe(1);
      expect(savedItems[1].unitPriceInCents).toBe(15000);
      expect(savedItems[1].discountInCents).toBe(0);
      expect(savedItems[1].subtotalInCents).toBe(15000);
    });

    it('should preserve all budget fields including nullable ones', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Test Item',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      // Act
      await sut.save(budget);

      // Assert
      const savedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
      });

      expect(savedBudget?.shipperId).toBeNull();
      expect(savedBudget?.commercialProcess).toBeNull();
      expect(savedBudget?.commercialNote).toBeNull();
      expect(savedBudget?.observations).toBeNull();
      expect(savedBudget?.approvedBy).toBeNull();
      expect(savedBudget?.approvedAt).toBeNull();
      expect(savedBudget?.rejectedBy).toBeNull();
      expect(savedBudget?.rejectedAt).toBeNull();
      expect(savedBudget?.rejectionReason).toBeNull();
    });

    it('should save budget with status fields when approved', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'CIF',
        shipperId: shipper.id,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Test Item',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      budget.approve('account-id-1');

      // Act
      await sut.save(budget);

      // Assert
      const savedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
      });

      expect(savedBudget?.status).toBe(BudgetStatus.APPROVED);
      expect(savedBudget?.approvedBy).toBe('account-id-1');
      expect(savedBudget?.approvedAt).toBeInstanceOf(Date);
      expect(savedBudget?.rejectedBy).toBeNull();
      expect(savedBudget?.rejectedAt).toBeNull();
      expect(savedBudget?.rejectionReason).toBeNull();
    });
  });

  describe('edit', () => {
    it('should update budget fields in the database', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'CIF',
        shipperId: shipper.id,
        freightValueInCents: 5000,
        subtotalInCents: 0,
        discountInCents: 1000,
        totalInCents: 0,
        commercialProcess: 'PROC-001',
        commercialNote: 'Original note',
        observations: 'Original observations',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Product Item',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      // Create a new seller for update
      const newSeller = await prisma.seller.create({
        data: {
          id: 'seller-02',
          name: 'Seller 02',
          phone: '11988888888',
          cellphone: '11988888888',
          commission: 7.5,
          zipCode: '87654-321',
          street: 'Second Avenue',
          number: '200',
          neighborhood: 'Uptown',
          city: 'Rio de Janeiro',
          state: 'RJ',
          active: true,
          role: {
            create: {
              role: AccountRole.SELLER,
              account: {
                create: {
                  email: 'seller02@test.com',
                  password: 'hashed_password_2',
                  status: AccountStatus.ACTIVE,
                },
              },
            },
          },
          companies: { connect: { id: company.id } },
        },
      });

      // Load the budget and update fields
      const loadedBudget = await sut.findById(budget.props.id);
      const updatedBudget = Budget.load(
        {
          ...loadedBudget!.props,
          sellerId: newSeller.id,
          freightType: 'FOB',
          shipperId: null,
          freightValueInCents: 0,
          discountInCents: 500,
          commercialProcess: 'PROC-002',
          commercialNote: 'Updated note',
          observations: 'Updated observations',
        },
        [...loadedBudget!.items],
      );

      // Act
      await sut.edit(updatedBudget);

      // Assert
      const editedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
      });

      expect(editedBudget?.sellerId).toBe(newSeller.id);
      expect(editedBudget?.freightType).toBe('FOB');
      expect(editedBudget?.shipperId).toBeNull();
      expect(editedBudget?.freightValueInCents).toBe(0);
      expect(editedBudget?.discountInCents).toBe(500);
      expect(editedBudget?.commercialProcess).toBe('PROC-002');
      expect(editedBudget?.commercialNote).toBe('Updated note');
      expect(editedBudget?.observations).toBe('Updated observations');
    });

    it('should not update companyId and clientId', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Test Item',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      // Load and attempt to update with different company and client
      const loadedBudget = await sut.findById(budget.props.id);
      const updatedBudget = Budget.load(
        {
          ...loadedBudget!.props,
          companyId: 'different-company-id',
          clientId: 'different-client-id',
        },
        [...loadedBudget!.items],
      );

      // Act
      await sut.edit(updatedBudget);

      // Assert - companyId and clientId should remain unchanged
      const editedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
      });

      expect(editedBudget?.companyId).toBe(company.id);
      expect(editedBudget?.clientId).toBe(client.id);
    });

    it('should delete old items and create new ones', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Original Item 1',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Original Item 2',
            quantity: 1,
            unitPriceInCents: 15000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      const originalItemIds = budget.items.map((item) => item.props.id);

      // Load and create new items
      const loadedBudget = await sut.findById(budget.props.id);
      const newItems = [
        BudgetItem.create({
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: service.id,
          description: 'New Service Item',
          quantity: 2,
          unitPriceInCents: 20000,
          discountInCents: 1000,
        }),
      ];

      const updatedBudget = Budget.load(loadedBudget!.props, newItems);

      // Act
      await sut.edit(updatedBudget);

      // Assert
      const remainingOldItems = await prisma.budgetItem.findMany({
        where: {
          budgetId: budget.props.id,
          id: { in: originalItemIds },
        },
      });
      expect(remainingOldItems).toHaveLength(0);

      const newItemsInDb = await prisma.budgetItem.findMany({
        where: { budgetId: budget.props.id },
      });
      expect(newItemsInDb).toHaveLength(1);
      expect(newItemsInDb[0].description).toBe('New Service Item');
      expect(newItemsInDb[0].itemType).toBe(BudgetItemType.SERVICE);
      expect(newItemsInDb[0].serviceId).toBe(service.id);
      expect(newItemsInDb[0].quantity).toBe(2);
      expect(newItemsInDb[0].unitPriceInCents).toBe(20000);
      expect(newItemsInDb[0].discountInCents).toBe(1000);
    });

    it('should update items maintaining correct order', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Item 1',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      const loadedBudget = await sut.findById(budget.props.id);
      const newItems = [
        BudgetItem.create({
          itemType: BudgetItemType.PRODUCT,
          productId: product.id,
          serviceId: null,
          description: 'First Item',
          quantity: 1,
          unitPriceInCents: 10000,
          discountInCents: 0,
        }),
        BudgetItem.create({
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: service.id,
          description: 'Second Item',
          quantity: 1,
          unitPriceInCents: 15000,
          discountInCents: 0,
        }),
        BudgetItem.create({
          itemType: BudgetItemType.PRODUCT,
          productId: product.id,
          serviceId: null,
          description: 'Third Item',
          quantity: 1,
          unitPriceInCents: 20000,
          discountInCents: 0,
        }),
      ];

      const updatedBudget = Budget.load(loadedBudget!.props, newItems);

      // Act
      await sut.edit(updatedBudget);

      // Assert
      const itemsInDb = await prisma.budgetItem.findMany({
        where: { budgetId: budget.props.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(itemsInDb).toHaveLength(3);
      expect(itemsInDb[0].description).toBe('First Item');
      expect(itemsInDb[1].description).toBe('Second Item');
      expect(itemsInDb[2].description).toBe('Third Item');
    });

    it('should update budget status fields correctly', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Test Item',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      const loadedBudget = await sut.findById(budget.props.id);
      loadedBudget!.approve('account-id-1');

      // Act
      await sut.edit(loadedBudget!);

      // Assert
      const editedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
      });

      expect(editedBudget?.status).toBe(BudgetStatus.APPROVED);
      expect(editedBudget?.approvedBy).toBe('account-id-1');
      expect(editedBudget?.approvedAt).toBeInstanceOf(Date);
    });

    it('should be transactional - rollback on error', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Test Item',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      const loadedBudget = await sut.findById(budget.props.id);

      // Create an invalid budget that will fail on items insert
      const invalidBudget = Budget.load(
        {
          ...loadedBudget!.props,
          id: 'non-existent-budget-id', // This should cause the transaction to fail
        },
        [...loadedBudget!.items],
      );

      // Act & Assert
      await expect(sut.edit(invalidBudget)).rejects.toThrow();

      // Verify original budget is unchanged
      const unchangedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
        include: { items: true },
      });

      expect(unchangedBudget).not.toBeNull();
      expect(unchangedBudget?.items).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete budget from database', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Test Item',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      // Act
      await sut.delete(budget.props.id);

      // Assert
      const deletedBudget = await prisma.budget.findUnique({
        where: { id: budget.props.id },
      });

      expect(deletedBudget).toBeNull();
    });

    it('should delete budget items automatically (cascade)', async() => {
      // Arrange
      const budget = Budget.create({
        companyId: company.id,
        clientId: client.id,
        sellerId: seller.id,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product.id,
            serviceId: null,
            description: 'Item 1',
            quantity: 1,
            unitPriceInCents: 10000,
            discountInCents: 0,
          },
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId: service.id,
            description: 'Item 2',
            quantity: 1,
            unitPriceInCents: 15000,
            discountInCents: 0,
          },
        ],
      });

      await sut.save(budget);

      // Act
      await sut.delete(budget.props.id);

      // Assert
      const remainingItems = await prisma.budgetItem.findMany({
        where: { budgetId: budget.props.id },
      });

      expect(remainingItems).toHaveLength(0);
    });

    it('should throw error when trying to delete non-existent budget', async() => {
      // Act & Assert
      await expect(sut.delete('non-existent-id')).rejects.toThrow();
    });
  });
});
