import { createMock } from '@golevelup/ts-jest';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { IProductRepository } from 'src/app/product/application/persistence/repository/product-repository.interface';
import { Product, ProductProps } from 'src/app/product/domain/entities/product.entity';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { ProductOutOfStockError } from 'src/app/product/domain/errors/product-out-of-stock.error';
import { IServiceRepository } from 'src/app/service/application/persistence/repository/service-repository.interface';
import { Service, ServiceProps } from 'src/app/service/domain/entities/service.entity';
import { ServiceNotActiveError } from 'src/app/service/domain/errors/service-not-active.error';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { StockValidator, StockValidatorInputDto } from './stock-validator.service';

function makeProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.load({
    id: new UUID().value,
    companyId: 'company-123',
    type: 'Type A',
    group01: 'Group 1',
    group02: 'Group 2',
    description: 'Test Product',
    complement: null,
    manufacturerCode: 'MFG123',
    brand: 'Brand X',
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
    markup: 50,
    marginB: 30,
    currency: 'BRL',
    exchangeRate: 1,
    unitCostInCents: 5000,
    unitPriceInCents: 10000,
    ean: '1234567890123',
    additionalInfo: null,
    images: [],
    supplierIds: [],
    currentStock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeService(overrides: Partial<ServiceProps> = {}): Service {
  return Service.load({
    id: new UUID().value,
    name: 'Test Service',
    nickname: 'TS',
    companyId: 'company-123',
    categoryId: 'category-123',
    productIds: ['prod-1', 'prod-2'],
    deadline: '7 dias',
    shippingValueInCents: 5000,
    warrant: '90 dias',
    weight: '1kg',
    maxVolume: '100L',
    dimensions: '10x10x10',
    commission: 10,
    valueInCents: 50000,
    description: 'A test service',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('StockValidator', () => {
  let validator: StockValidator;
  let productRepository: jest.Mocked<IProductRepository>;
  let serviceRepository: jest.Mocked<IServiceRepository>;

  beforeEach(() => {
    validator = new StockValidator();
    productRepository = createMock<IProductRepository>();
    serviceRepository = createMock<IServiceRepository>();
  });

  describe('validate', () => {
    describe('Product validation', () => {
      it('should pass validation when product exists and has sufficient stock', async() => {
        // Arrange
        const productId = 'product-123';
        const quantity = 5;

        const product = makeProduct({ currentStock: quantity });
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity,
        };

        productRepository.findById.mockResolvedValue(product);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).resolves.not.toThrow();
        expect(productRepository.findById).toHaveBeenNthCalledWith(1, productId);
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should throw ProductNotFoundError when product does not exist', async() => {
        // Arrange
        const productId = 'non-existent-product';
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity: 5,
        };

        productRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).rejects.toThrow(ProductNotFoundError);
        expect(productRepository.findById).toHaveBeenNthCalledWith(1, productId);
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should throw ProductOutOfStockError when product has insufficient stock', async() => {
        // Arrange
        const productId = 'product-123';
        const requestedQuantity = 15;
        const availableStock = 5;

        const product = makeProduct({ currentStock: availableStock });
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity: requestedQuantity,
        };

        productRepository.findById.mockResolvedValue(product);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).rejects.toThrow(ProductOutOfStockError);
        expect(productRepository.findById).toHaveBeenNthCalledWith(1, productId);
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should validate multiple products successfully', async() => {
        // Arrange
        const product1Id = 'product-1';
        const product2Id = 'product-2';

        const budgetItem1: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId: product1Id,
          serviceId: null,
          quantity: 5,
        };
        const budgetItem2: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId: product2Id,
          serviceId: null,
          quantity: 3,
        };

        const product1 = makeProduct({ currentStock: 10 });
        const product2 = makeProduct({ currentStock: 20 });

        productRepository.findById
          .mockResolvedValueOnce(product1)
          .mockResolvedValueOnce(product2);

        // Act & Assert
        await expect(
          validator.validate([budgetItem1, budgetItem2], productRepository, serviceRepository),
        ).resolves.not.toThrow();

        expect(productRepository.findById).toHaveBeenNthCalledWith(1, product1Id);
        expect(productRepository.findById).toHaveBeenNthCalledWith(2, product2Id);
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should validate multiple products and one of them does not exist', async() => {
        // Arrange
        const product1Id = 'product-1';
        const product2Id = 'product-2';

        const budgetItem1: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId: product1Id,
          serviceId: null,
          quantity: 5,
        };
        const budgetItem2: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId: product2Id,
          serviceId: null,
          quantity: 21,
        };

        const product1 = null;
        const product2 = makeProduct({ currentStock: 20 });

        productRepository.findById
          .mockResolvedValueOnce(product1)
          .mockResolvedValueOnce(product2);

        // Act & Assert
        await expect(
          validator.validate([budgetItem1, budgetItem2], productRepository, serviceRepository),
        ).rejects.toThrow(ProductNotFoundError);

        expect(productRepository.findById).toHaveBeenNthCalledWith(1, product1Id);
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should validate multiple products and one of them does not have sufficient stock', async() => {
        // Arrange
        const product1Id = 'product-1';
        const product2Id = 'product-2';

        const budgetItem1: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId: product1Id,
          serviceId: null,
          quantity: 5,
        };
        const budgetItem2: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId: product2Id,
          serviceId: null,
          quantity: 21,
        };

        const product1 = makeProduct({ currentStock: 10 });
        const product2 = makeProduct({ currentStock: 20 });

        productRepository.findById
          .mockResolvedValueOnce(product1)
          .mockResolvedValueOnce(product2);

        // Act & Assert
        await expect(
          validator.validate([budgetItem1, budgetItem2], productRepository, serviceRepository),
        ).rejects.toThrow(ProductOutOfStockError);

        expect(productRepository.findById).toHaveBeenNthCalledWith(1, product1Id);
        expect(productRepository.findById).toHaveBeenNthCalledWith(2, product2Id);
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should skip validation for product item with null productId', async() => {
        // Arrange
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId: null,
          serviceId: null,
          quantity: 5,
        };

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).resolves.not.toThrow();

        expect(productRepository.findById).not.toHaveBeenCalled();
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });
    });

    describe('Service validation', () => {
      it('should pass validation when service exists and is active', async() => {
        // Arrange
        const serviceId = 'service-123';

        const service = makeService({ id: serviceId, active: true });
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId,
          quantity: 1,
        };

        serviceRepository.findById.mockResolvedValue(service);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).resolves.not.toThrow();

        expect(serviceRepository.findById).toHaveBeenNthCalledWith(1, serviceId);
        expect(productRepository.findById).not.toHaveBeenCalled();
      });

      it('should throw ServiceNotFoundError when service does not exist', async() => {
        // Arrange
        const serviceId = 'non-existent-service';

        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId,
          quantity: 1,
        };

        serviceRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).rejects.toThrow(ServiceNotFoundError);

        expect(serviceRepository.findById).toHaveBeenNthCalledWith(1, serviceId);
        expect(productRepository.findById).not.toHaveBeenCalled();
      });

      it('should throw ServiceNotActiveError when service is not active', async() => {
        // Arrange
        const serviceId = 'service-123';

        const service = makeService({ id: serviceId, active: false });
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId,
          quantity: 1,
        };

        serviceRepository.findById.mockResolvedValue(service);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).rejects.toThrow(ServiceNotActiveError);

        expect(serviceRepository.findById).toHaveBeenNthCalledWith(1, serviceId);
        expect(productRepository.findById).not.toHaveBeenCalled();
      });

      it('should validate multiple services successfully', async() => {
        // Arrange
        const service1Id = 'service-1';
        const service2Id = 'service-2';

        const budgetItem1: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: service1Id,
          quantity: 1,
        };
        const budgetItem2: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: service2Id,
          quantity: 2,
        };

        const service1 = makeService({ id: service1Id, active: true });
        const service2 = makeService({ id: service2Id, active: true });

        serviceRepository.findById
          .mockResolvedValueOnce(service1)
          .mockResolvedValueOnce(service2);

        // Act & Assert
        await expect(
          validator.validate([budgetItem1, budgetItem2], productRepository, serviceRepository),
        ).resolves.not.toThrow();

        expect(serviceRepository.findById).toHaveBeenNthCalledWith(1, service1Id);
        expect(serviceRepository.findById).toHaveBeenNthCalledWith(2, service2Id);
        expect(productRepository.findById).not.toHaveBeenCalled();
      });

      it('should validate multiple services and one of them is not active', async() => {
        // Arrange
        const service1Id = 'service-1';
        const service2Id = 'service-2';

        const budgetItem1: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: service1Id,
          quantity: 1,
        };
        const budgetItem2: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: service2Id,
          quantity: 21,
        };

        const service1 = makeService({ id: service1Id, active: true });
        const service2 = makeService({ id: service2Id, active: false, name: 'Service 2' });

        serviceRepository.findById
          .mockResolvedValueOnce(service1)
          .mockResolvedValueOnce(service2);

        // Act & Assert
        await expect(
          validator.validate([budgetItem1, budgetItem2], productRepository, serviceRepository),
        ).rejects.toThrow('Serviço "Service 2" está inativo');

        expect(serviceRepository.findById).toHaveBeenNthCalledWith(1, service1Id);
        expect(serviceRepository.findById).toHaveBeenNthCalledWith(2, service2Id);
        expect(productRepository.findById).not.toHaveBeenCalled();
      });

      it('should skip validation for service item with null serviceId', async() => {
        // Arrange
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: null,
          quantity: 1,
        };

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).resolves.not.toThrow();

        expect(serviceRepository.findById).not.toHaveBeenCalled();
        expect(productRepository.findById).not.toHaveBeenCalled();
      });
    });

    describe('Mixed validation (Products and Services)', () => {
      it('should validate mixed items (products and services) successfully', async() => {
        // Arrange
        const productId = 'product-123';
        const serviceId = 'service-123';

        const productItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity: 5,
        };
        const serviceItem: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId,
          quantity: 1,
        };

        const product = makeProduct({ currentStock: 10 });
        const service = makeService({ id: serviceId, active: true });

        productRepository.findById.mockResolvedValue(product);
        serviceRepository.findById.mockResolvedValue(service);

        // Act & Assert
        await expect(
          validator.validate([productItem, serviceItem], productRepository, serviceRepository),
        ).resolves.not.toThrow();

        expect(productRepository.findById).toHaveBeenNthCalledWith(1, productId);
        expect(serviceRepository.findById).toHaveBeenNthCalledWith(1, serviceId);
      });

      it('should stop validation at first error (product not found)', async() => {
        // Arrange
        const productId = 'non-existent-product';
        const serviceId = 'service-123';

        const productItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity: 5,
        };
        const serviceItem: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId,
          quantity: 1,
        };

        productRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          validator.validate([productItem, serviceItem], productRepository, serviceRepository),
        ).rejects.toThrow(ProductNotFoundError);

        expect(productRepository.findById).toHaveBeenNthCalledWith(1, productId);
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should stop validation at first error (service not active)', async() => {
        // Arrange
        const productId = 'product-123';
        const serviceId = 'service-123';

        const productItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity: 5,
        };
        const serviceItem: StockValidatorInputDto = {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId,
          quantity: 1,
        };

        const product = makeProduct({ currentStock: 10 });
        const service = makeService({ id: serviceId, active: false, name: 'Service 2' });

        productRepository.findById.mockResolvedValue(product);
        serviceRepository.findById.mockResolvedValue(service);

        // Act & Assert
        await expect(
          validator.validate([productItem, serviceItem], productRepository, serviceRepository),
        ).rejects.toThrow(ServiceNotActiveError);

        expect(productRepository.findById).toHaveBeenNthCalledWith(1, productId);
        expect(serviceRepository.findById).toHaveBeenNthCalledWith(1, serviceId);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty items array', async() => {
        // Act & Assert
        await expect(
          validator.validate([], productRepository, serviceRepository),
        ).resolves.not.toThrow();

        expect(productRepository.findById).not.toHaveBeenCalled();
        expect(serviceRepository.findById).not.toHaveBeenCalled();
      });

      it('should validate product with exact stock quantity', async() => {
        // Arrange
        const productId = 'product-123';
        const quantity = 10;

        const product = makeProduct({ currentStock: quantity });
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity,
        };

        productRepository.findById.mockResolvedValue(product);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).resolves.not.toThrow();
      });

      it('should fail validation when product has one less unit than required', async() => {
        // Arrange
        const productId = 'product-123';
        const requestedQuantity = 10;
        const availableStock = 9;

        const product = makeProduct({ currentStock: availableStock });
        const budgetItem: StockValidatorInputDto = {
          itemType: BudgetItemType.PRODUCT,
          productId,
          serviceId: null,
          quantity: requestedQuantity,
        };

        productRepository.findById.mockResolvedValue(product);

        // Act & Assert
        await expect(
          validator.validate([budgetItem], productRepository, serviceRepository),
        ).rejects.toThrow(ProductOutOfStockError);
      });
    });
  });
});
