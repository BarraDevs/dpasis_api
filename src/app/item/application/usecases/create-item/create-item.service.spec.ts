import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { ItemModule } from 'src/app/item/item.module';
import { OwnerDto } from 'src/app/owner/application/dtos/owner.dto';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IItemRepository } from '../../persistence/repository/item-repository.interface';
import { CreateItems } from './create-item.service';
import { CreateItemsInputDto } from './dtos/create-item.dto';

describe('CreateItems', () => {
  let sut: CreateItems;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ItemModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateItems);
    prisma = module.get(PrismaService);

    await prisma.owner.deleteMany();
    await prisma.item.deleteMany();
  });

  afterEach(async() => {
    await prisma.owner.deleteMany();
    await prisma.item.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('Unit Tests', () => {
    let mockItemRepository: jest.Mocked<IItemRepository>;
    let mockFindOwnerById: jest.Mocked<FindOwnerById>;

    beforeEach(() => {
      mockItemRepository = {
        createMany: jest.fn(),
        edit: jest.fn(),
        delete: jest.fn(),
      };

      mockFindOwnerById = {
        execute: jest.fn(),
      } as any;

      sut = new CreateItems(mockItemRepository, mockFindOwnerById);
    });

    it('should create items successfully when owner exists', async() => {
      // Arrange
      const mockOwner = createMock<OwnerDto>();
      mockFindOwnerById.execute.mockResolvedValue(mockOwner);
      mockItemRepository.createMany.mockResolvedValue(undefined);

      const inputDto: CreateItemsInputDto = {
        ownerId: 'valid-owner-id',
        items: [
          {
            description: 'Test Item 1',
            serviceCode: 'SKU-001',
            quantity: 2,
            unitPriceInCents: 15000,
          },
          {
            description: 'Test Item 2',
            serviceCode: 'SKU-002',
            quantity: 1,
            unitPriceInCents: 8000,
          },
        ],
      };

      // Act
      const result = await sut.execute(inputDto);

      // Assert
      expect(mockFindOwnerById.execute).toHaveBeenCalledWith('valid-owner-id');
      expect(mockItemRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Item),
          expect.any(Item),
        ])
      );
      expect(result.count).toBe(2);
      expect(result.ids).toHaveLength(2);
      expect(result.ids.every(id => typeof id === 'string')).toBe(true);
    });

    it('should create single item successfully', async() => {
      // Arrange
      const mockOwner = createMock<OwnerDto>();
      mockFindOwnerById.execute.mockResolvedValue(mockOwner);
      mockItemRepository.createMany.mockResolvedValue(undefined);

      const inputDto: CreateItemsInputDto = {
        ownerId: 'valid-owner-id',
        items: [
          {
            description: 'Single Test Item',
            serviceCode: 'SKU-SINGLE',
            quantity: 5,
            unitPriceInCents: 25000,
          },
        ],
      };

      // Act
      const result = await sut.execute(inputDto);

      // Assert
      expect(mockFindOwnerById.execute).toHaveBeenCalledWith('valid-owner-id');
      expect(mockItemRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Item)])
      );
      expect(result.count).toBe(1);
      expect(result.ids).toHaveLength(1);
    });

    it('should throw OwnerNotFoundError when owner does not exist', async() => {
      // Arrange
      mockFindOwnerById.execute.mockResolvedValue(null as any);

      const inputDto: CreateItemsInputDto = {
        ownerId: 'non-existent-owner-id',
        items: [
          {
            description: 'Test Item',
            serviceCode: 'SKU-001',
            quantity: 1,
            unitPriceInCents: 1000,
          },
        ],
      };

      // Act & Assert
      await expect(sut.execute(inputDto)).rejects.toThrow(OwnerNotFoundError);
      expect(mockFindOwnerById.execute).toHaveBeenCalledWith('non-existent-owner-id');
      expect(mockItemRepository.createMany).not.toHaveBeenCalled();
    });

    it('should create Item entities with correct properties', async() => {
      // Arrange
      const mockOwner = createMock<OwnerDto>();
      mockFindOwnerById.execute.mockResolvedValue(mockOwner);

      let capturedItems: Item[] = [];
      mockItemRepository.createMany.mockImplementation((items: Item[]) => {
        capturedItems = items;
        return Promise.resolve();
      });

      const inputDto: CreateItemsInputDto = {
        ownerId: 'test-owner-id',
        items: [
          {
            description: 'Detailed Test Item',
            serviceCode: 'SKU-DETAILED',
            quantity: 3,
            unitPriceInCents: 12500,
          },
        ],
      };

      // Act
      await sut.execute(inputDto);

      // Assert
      expect(capturedItems).toHaveLength(1);
      expect(capturedItems[0].props.ownerId).toBe('test-owner-id');
      expect(capturedItems[0].props.description).toBe('Detailed Test Item');
      expect(capturedItems[0].props.serviceCode).toBe('SKU-DETAILED');
      expect(capturedItems[0].props.quantity).toBe(3);
      expect(capturedItems[0].props.unitPriceInCents).toBe(12500);
      expect(capturedItems[0].props.id).toBeDefined();
    });

    it('should assign ownerId to all items', async() => {
      // Arrange
      const mockOwner = createMock<OwnerDto>();
      mockFindOwnerById.execute.mockResolvedValue(mockOwner);

      let capturedItems: Item[] = [];
      mockItemRepository.createMany.mockImplementation((items: Item[]) => {
        capturedItems = items;
        return Promise.resolve();
      });

      const inputDto: CreateItemsInputDto = {
        ownerId: 'shared-owner-id',
        items: [
          {
            description: 'Item A',
            serviceCode: 'SKU-A',
            quantity: 1,
            unitPriceInCents: 1000,
          },
          {
            description: 'Item B',
            serviceCode: 'SKU-B',
            quantity: 2,
            unitPriceInCents: 2000,
          },
          {
            description: 'Item C',
            serviceCode: 'SKU-C',
            quantity: 3,
            unitPriceInCents: 3000,
          },
        ],
      };

      // Act
      await sut.execute(inputDto);

      // Assert
      expect(capturedItems).toHaveLength(3);
      capturedItems.forEach(item => {
        expect(item.props.ownerId).toBe('shared-owner-id');
      });
    });

    it('should handle items with different properties correctly', async() => {
      // Arrange
      const mockOwner = createMock<OwnerDto>();
      mockFindOwnerById.execute.mockResolvedValue(mockOwner);

      let capturedItems: Item[] = [];
      mockItemRepository.createMany.mockImplementation((items: Item[]) => {
        capturedItems = items;
        return Promise.resolve();
      });

      const inputDto: CreateItemsInputDto = {
        ownerId: 'test-owner',
        items: [
          {
            description: 'Free Item',
            serviceCode: 'FREE-001',
            quantity: 1,
            unitPriceInCents: 0, // Free item
          },
          {
            description: 'Expensive Item',
            serviceCode: 'EXP-001',
            quantity: 999, // High quantity
            unitPriceInCents: 999999, // Expensive
          },
        ],
      };

      // Act
      await sut.execute(inputDto);

      // Assert
      expect(capturedItems).toHaveLength(2);

      // Free item
      expect(capturedItems[0].props.unitPriceInCents).toBe(0);
      expect(capturedItems[0].props.quantity).toBe(1);

      // Expensive item
      expect(capturedItems[1].props.unitPriceInCents).toBe(999999);
      expect(capturedItems[1].props.quantity).toBe(999);
    });

    it('should propagate repository errors', async() => {
      // Arrange
      const mockOwner = createMock<OwnerDto>();
      mockFindOwnerById.execute.mockResolvedValue(mockOwner);

      const repositoryError = new Error('Database connection failed');
      mockItemRepository.createMany.mockRejectedValue(repositoryError);

      const inputDto: CreateItemsInputDto = {
        ownerId: 'valid-owner-id',
        items: [
          {
            description: 'Test Item',
            serviceCode: 'SKU-001',
            quantity: 1,
            unitPriceInCents: 1000,
          },
        ],
      };

      // Act & Assert
      await expect(sut.execute(inputDto)).rejects.toThrow('Database connection failed');
      expect(mockFindOwnerById.execute).toHaveBeenCalledWith('valid-owner-id');
      expect(mockItemRepository.createMany).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    let existingOwner: OwnerDto;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: { id: 'integration-test-owner' },
      });
    });

    it('should create multiple items successfully with real database', async() => {
      // Arrange
      const inputDto: CreateItemsInputDto = {
        ownerId: existingOwner.id,
        items: [
          {
            description: 'Integration Test Item 1',
            serviceCode: 'INT-SKU-001',
            quantity: 2,
            unitPriceInCents: 15000,
          },
          {
            description: 'Integration Test Item 2',
            serviceCode: 'INT-SKU-002',
            quantity: 1,
            unitPriceInCents: 8500,
          },
          {
            description: 'Integration Test Item 3',
            serviceCode: 'INT-SKU-003',
            quantity: 5,
            unitPriceInCents: 3200,
          },
        ],
      };

      // Act
      const result = await sut.execute(inputDto);

      // Assert
      expect(result.count).toBe(3);
      expect(result.ids).toHaveLength(3);

      // Verify items were created in database
      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(createdItems).toHaveLength(3);

      // Verify first item
      expect(createdItems[0].id).toBe(result.ids[0]);
      expect(createdItems[0].ownerId).toBe(existingOwner.id);
      expect(createdItems[0].description).toBe('Integration Test Item 1');
      expect(createdItems[0].serviceCode).toBe('INT-SKU-001');
      expect(createdItems[0].quantity).toBe(2);
      expect(createdItems[0].unitPriceInCents).toBe(15000);

      // Verify second item
      expect(createdItems[1].id).toBe(result.ids[1]);
      expect(createdItems[1].description).toBe('Integration Test Item 2');
      expect(createdItems[1].serviceCode).toBe('INT-SKU-002');
      expect(createdItems[1].quantity).toBe(1);
      expect(createdItems[1].unitPriceInCents).toBe(8500);

      // Verify third item
      expect(createdItems[2].id).toBe(result.ids[2]);
      expect(createdItems[2].description).toBe('Integration Test Item 3');
      expect(createdItems[2].serviceCode).toBe('INT-SKU-003');
      expect(createdItems[2].quantity).toBe(5);
      expect(createdItems[2].unitPriceInCents).toBe(3200);

      // Verify timestamps
      createdItems.forEach(item => {
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should create single item successfully with real database', async() => {
      // Arrange
      const inputDto: CreateItemsInputDto = {
        ownerId: existingOwner.id,
        items: [
          {
            description: 'Single Integration Test Item',
            serviceCode: 'SINGLE-INT-001',
            quantity: 7,
            unitPriceInCents: 45000,
          },
        ],
      };

      // Act
      const result = await sut.execute(inputDto);

      // Assert
      expect(result.count).toBe(1);
      expect(result.ids).toHaveLength(1);

      const createdItem = await prisma.item.findUnique({
        where: { id: result.ids[0] },
      });

      expect(createdItem).not.toBeNull();
      expect(createdItem?.ownerId).toBe(existingOwner.id);
      expect(createdItem?.description).toBe('Single Integration Test Item');
      expect(createdItem?.serviceCode).toBe('SINGLE-INT-001');
      expect(createdItem?.quantity).toBe(7);
      expect(createdItem?.unitPriceInCents).toBe(45000);
    });

    it('should throw OwnerNotFoundError when owner does not exist in database', async() => {
      // Arrange
      const inputDto: CreateItemsInputDto = {
        ownerId: 'non-existent-owner-uuid',
        items: [
          {
            description: 'Test Item',
            serviceCode: 'TEST-001',
            quantity: 1,
            unitPriceInCents: 1000,
          },
        ],
      };

      // Act & Assert
      await expect(sut.execute(inputDto)).rejects.toThrow(OwnerNotFoundError);

      // Verify no items were created
      const itemCount = await prisma.item.count({
        where: { ownerId: 'non-existent-owner-uuid' },
      });
      expect(itemCount).toBe(0);
    });

    it('should handle items with boundary values', async() => {
      // Arrange
      const inputDto: CreateItemsInputDto = {
        ownerId: existingOwner.id,
        items: [
          {
            description: 'Free Item',
            serviceCode: 'FREE-BOUNDARY',
            quantity: 1, // Minimum quantity
            unitPriceInCents: 0, // Minimum price (free)
          },
          {
            description: 'High Value Item',
            serviceCode: 'HIGH-VALUE',
            quantity: 999, // High quantity
            unitPriceInCents: 999999, // High price
          },
        ],
      };

      // Act
      const result = await sut.execute(inputDto);

      // Assert
      expect(result.count).toBe(2);

      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
        orderBy: { unitPriceInCents: 'asc' },
      });

      expect(createdItems).toHaveLength(2);

      // Free item
      expect(createdItems[0].unitPriceInCents).toBe(0);
      expect(createdItems[0].quantity).toBe(1);

      // High value item
      expect(createdItems[1].unitPriceInCents).toBe(999999);
      expect(createdItems[1].quantity).toBe(999);
    });

    it('should handle items with special characters in text fields', async() => {
      // Arrange
      const inputDto: CreateItemsInputDto = {
        ownerId: existingOwner.id,
        items: [
          {
            description: 'Item with special chars: ãçñü & symbols @#$%',
            serviceCode: 'SP-CHAR-001',
            quantity: 1,
            unitPriceInCents: 2500,
          },
        ],
      };

      // Act
      const result = await sut.execute(inputDto);

      // Assert
      const createdItem = await prisma.item.findUnique({
        where: { id: result.ids[0] },
      });

      expect(createdItem?.description).toBe('Item with special chars: ãçñü & symbols @#$%');
      expect(createdItem?.serviceCode).toBe('SP-CHAR-001');
    });

    it('should maintain data integrity across multiple sequential creations', async() => {
      // Arrange & Act - Create items in sequence
      const firstBatch = await sut.execute({
        ownerId: existingOwner.id,
        items: [
          {
            description: 'First Batch Item 1',
            serviceCode: 'FB-001',
            quantity: 1,
            unitPriceInCents: 1000,
          },
        ],
      });

      const secondBatch = await sut.execute({
        ownerId: existingOwner.id,
        items: [
          {
            description: 'Second Batch Item 1',
            serviceCode: 'SB-001',
            quantity: 2,
            unitPriceInCents: 2000,
          },
          {
            description: 'Second Batch Item 2',
            serviceCode: 'SB-002',
            quantity: 3,
            unitPriceInCents: 3000,
          },
        ],
      });

      // Assert
      expect(firstBatch.count).toBe(1);
      expect(secondBatch.count).toBe(2);

      const allItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(allItems).toHaveLength(3);
      expect(allItems[0].description).toBe('First Batch Item 1');
      expect(allItems[1].description).toBe('Second Batch Item 1');
      expect(allItems[2].description).toBe('Second Batch Item 2');

      // Verify all IDs are unique
      const ids = allItems.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});
