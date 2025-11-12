import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ItemNotFoundError } from 'src/app/item/domain/errors/item-not-found.error';
import { ItemModule } from 'src/app/item/item.module';
import { OwnerDto } from 'src/app/owner/application/dtos/owner.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ItemDto } from '../../dtos/item.dto';
import { IItemDao } from '../../persistence/dao/item-dao.interface';
import { FindItemById } from './find-item-by-id.service';

describe('FindItemById', () => {
  let sut: FindItemById;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ItemModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindItemById);
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
    let mockItemDao: jest.Mocked<IItemDao>;

    beforeEach(() => {
      mockItemDao = {
        findById: jest.fn(),
        findAll: jest.fn(),
      };

      sut = new FindItemById(mockItemDao);
    });

    it('should return item when item exists', async() => {
      // Arrange
      const itemId = 'valid-item-id';
      const mockItem = createMock<ItemDto>();
      mockItemDao.findById.mockResolvedValue(mockItem);

      // Act
      const result = await sut.execute(itemId);

      // Assert
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(result).toEqual(mockItem);
      expect(result).toEqual<ItemDto>(mockItem);
    });

    it('should throw ItemNotFoundError when item does not exist', async() => {
      // Arrange
      const itemId = 'non-existent-item-id';
      mockItemDao.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(itemId)).rejects.toThrow(ItemNotFoundError);
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
    });

    it('should return item with all properties correctly', async() => {
      // Arrange
      const itemId = 'detailed-item-id';
      const mockItem: ItemDto = {
        id: itemId,
        ownerId: 'detailed-owner-id',
        description: 'Detailed Test Item with Special Characters: ãçñü & symbols @#$%',
        serviceCode: 'DETAILED-SKU-001',
        quantity: 999,
        unitPriceInCents: 999999,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-02T15:30:00Z'),
      };

      mockItemDao.findById.mockResolvedValue(mockItem);

      // Act
      const result = await sut.execute(itemId);

      // Assert
      expect(result).toEqual(mockItem);
      expect(result.id).toBe(itemId);
      expect(result.ownerId).toBe(mockItem.ownerId);
      expect(result.description).toBe(mockItem.description);
      expect(result.serviceCode).toBe(mockItem.serviceCode);
      expect(result.quantity).toBe(mockItem.quantity);
      expect(result.unitPriceInCents).toBe(mockItem.unitPriceInCents);
      expect(result.createdAt).toEqual(mockItem.createdAt);
      expect(result.updatedAt).toEqual(mockItem.updatedAt);
    });

    it('should return free item (zero price) correctly', async() => {
      // Arrange
      const itemId = 'free-item-id';
      const mockItem: ItemDto = {
        id: itemId,
        ownerId: 'owner-id',
        description: 'Free Item',
        serviceCode: 'FREE-001',
        quantity: 1,
        unitPriceInCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockItemDao.findById.mockResolvedValue(mockItem);

      // Act
      const result = await sut.execute(itemId);

      // Assert
      expect(result).toEqual(mockItem);
      expect(result.unitPriceInCents).toBe(0);
      expect(result.quantity).toBe(1);
    });

    it('should handle minimum quantity correctly', async() => {
      // Arrange
      const itemId = 'min-quantity-item';
      const mockItem: ItemDto = {
        id: itemId,
        ownerId: 'owner-id',
        description: 'Minimum Quantity Item',
        serviceCode: 'MIN-001',
        quantity: 1,
        unitPriceInCents: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockItemDao.findById.mockResolvedValue(mockItem);

      // Act
      const result = await sut.execute(itemId);

      // Assert
      expect(result.quantity).toBe(1);
      expect(result.unitPriceInCents).toBe(500);
    });

    it('should propagate dao errors', async() => {
      // Arrange
      const itemId = 'error-item-id';
      const daoError = new Error('Database connection failed');
      mockItemDao.findById.mockRejectedValue(daoError);

      // Act & Assert
      await expect(sut.execute(itemId)).rejects.toThrow('Database connection failed');
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
    });

    it('should handle malformed UUID gracefully', async() => {
      // Arrange
      const malformedId = 'invalid-uuid-format';
      mockItemDao.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(malformedId)).rejects.toThrow(ItemNotFoundError);
      expect(mockItemDao.findById).toHaveBeenCalledWith(malformedId);
    });

    it('should handle empty string ID', async() => {
      // Arrange
      const emptyId = '';
      mockItemDao.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(emptyId)).rejects.toThrow(ItemNotFoundError);
      expect(mockItemDao.findById).toHaveBeenCalledWith(emptyId);
    });
  });

  describe('Integration Tests', () => {
    let existingOwner: OwnerDto;
    let existingItem: ItemDto;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: { id: 'find-by-id-test-owner' },
      });

      existingItem = await prisma.item.create({
        data: {
          id: 'find-by-id-test-item',
          ownerId: existingOwner.id,
          description: 'Integration Test Item',
          serviceCode: 'INT-SKU-001',
          quantity: 3,
          unitPriceInCents: 12500,
        },
      });
    });

    it('should find existing item by ID from database', async() => {
      // Act
      const result = await sut.execute(existingItem.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<ItemDto>(existingItem);
    });

    it('should throw ItemNotFoundError for non-existent item in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-item-uuid';

      // Act & Assert
      await expect(sut.execute(nonExistentId)).rejects.toThrow(ItemNotFoundError);
    });

    it('should throw ItemNotFoundError for malformed UUID in database', async() => {
      // Arrange
      const malformedId = 'invalid-uuid-format';

      // Act & Assert
      await expect(sut.execute(malformedId)).rejects.toThrow(ItemNotFoundError);
    });

    it('should throw ItemNotFoundError for empty string ID in database', async() => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      await expect(sut.execute(emptyId)).rejects.toThrow(ItemNotFoundError);
    });

    it('should find item with boundary values', async() => {
      // Arrange - Create item with boundary values
      const boundaryItem = await prisma.item.create({
        data: {
          id: 'boundary-test-item',
          ownerId: existingOwner.id,
          description: 'Free Item with Minimum Quantity',
          serviceCode: 'BOUNDARY-001',
          quantity: 1, // Minimum quantity
          unitPriceInCents: 0, // Minimum price (free)
        },
      });

      // Act
      const result = await sut.execute(boundaryItem.id);

      // Assert
      expect(result.id).toBe(boundaryItem.id);
      expect(result.quantity).toBe(1);
      expect(result.unitPriceInCents).toBe(0);
      expect(result.description).toBe('Free Item with Minimum Quantity');
    });

    it('should find item with maximum values', async() => {
      // Arrange - Create item with high values
      const highValueItem = await prisma.item.create({
        data: {
          id: 'high-value-test-item',
          ownerId: existingOwner.id,
          description: 'High Value Item',
          serviceCode: 'HIGH-VALUE-001',
          quantity: 999, // High quantity
          unitPriceInCents: 999999, // High price
        },
      });

      // Act
      const result = await sut.execute(highValueItem.id);

      // Assert
      expect(result.id).toBe(highValueItem.id);
      expect(result.quantity).toBe(999);
      expect(result.unitPriceInCents).toBe(999999);
      expect(result.description).toBe('High Value Item');
    });

    it('should find item with special characters in text fields', async() => {
      // Arrange - Create item with special characters
      const specialCharItem = await prisma.item.create({
        data: {
          id: 'special-char-test-item',
          ownerId: existingOwner.id,
          description: 'Item with special chars: ãçñü & symbols @#$%',
          serviceCode: 'SP-CHAR-001',
          quantity: 2,
          unitPriceInCents: 3500,
        },
      });

      // Act
      const result = await sut.execute(specialCharItem.id);

      // Assert
      expect(result.id).toBe(specialCharItem.id);
      expect(result.description).toBe('Item with special chars: ãçñü & symbols @#$%');
      expect(result.serviceCode).toBe('SP-CHAR-001');
    });

    it('should find item with long serviceCode', async() => {
      // Arrange - Create item with maximum serviceCode length
      const longServiceCode = 'A'.repeat(200); // Assuming max length is around 256
      const longServiceCodeItem = await prisma.item.create({
        data: {
          id: 'long-service-code-item',
          ownerId: existingOwner.id,
          description: 'Item with long service code',
          serviceCode: longServiceCode,
          quantity: 1,
          unitPriceInCents: 1000,
        },
      });

      // Act
      const result = await sut.execute(longServiceCodeItem.id);

      // Assert
      expect(result.id).toBe(longServiceCodeItem.id);
      expect(result.serviceCode).toBe(longServiceCode);
      expect(result.serviceCode.length).toBe(200);
    });

    it('should find item after update', async() => {
      // Arrange - Update existing item
      await prisma.item.update({
        where: { id: existingItem.id },
        data: {
          description: 'Updated Integration Test Item',
          quantity: 5,
          unitPriceInCents: 20000,
        },
      });

      // Act
      const result = await sut.execute(existingItem.id);

      // Assert
      expect(result.id).toBe(existingItem.id);
      expect(result.description).toBe('Updated Integration Test Item');
      expect(result.quantity).toBe(5);
      expect(result.unitPriceInCents).toBe(20000);
      expect(result.updatedAt.getTime()).toBeGreaterThan(result.createdAt.getTime());
    });

    it('should maintain data consistency when finding multiple items', async() => {
      // Arrange - Create multiple items
      const items = await Promise.all([
        prisma.item.create({
          data: {
            id: 'consistency-item-1',
            ownerId: existingOwner.id,
            description: 'Consistency Test Item 1',
            serviceCode: 'CONS-001',
            quantity: 1,
            unitPriceInCents: 1000,
          },
        }),
        prisma.item.create({
          data: {
            id: 'consistency-item-2',
            ownerId: existingOwner.id,
            description: 'Consistency Test Item 2',
            serviceCode: 'CONS-002',
            quantity: 2,
            unitPriceInCents: 2000,
          },
        }),
      ]);

      // Act - Find each item
      const results = await Promise.all([
        sut.execute(items[0].id),
        sut.execute(items[1].id),
        sut.execute(existingItem.id),
      ]);

      // Assert
      expect(results).toHaveLength(3);

      // Verify first item
      expect(results[0].id).toBe('consistency-item-1');
      expect(results[0].description).toBe('Consistency Test Item 1');

      // Verify second item
      expect(results[1].id).toBe('consistency-item-2');
      expect(results[1].description).toBe('Consistency Test Item 2');

      // Verify existing item
      expect(results[2].id).toBe(existingItem.id);
      expect(results[2].description).toBe('Integration Test Item');

      // Verify all items have unique IDs
      const ids = results.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('should handle concurrent requests gracefully', async() => {
      // Act - Make concurrent requests for the same item
      const concurrentRequests = Array.from({ length: 5 }, () =>
        sut.execute(existingItem.id)
      );

      const results = await Promise.all(concurrentRequests);

      // Assert
      expect(results).toHaveLength(5);

      // All results should be identical
      results.forEach(result => {
        expect(result.id).toBe(existingItem.id);
        expect(result.description).toBe('Integration Test Item');
        expect(result.serviceCode).toBe('INT-SKU-001');
        expect(result.quantity).toBe(3);
        expect(result.unitPriceInCents).toBe(12500);
      });
    });
  });
});
