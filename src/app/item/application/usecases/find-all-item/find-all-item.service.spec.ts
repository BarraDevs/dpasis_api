import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ItemModule } from 'src/app/item/item.module';
import { OwnerDto } from 'src/app/owner/application/dtos/owner.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ItemDto } from '../../dtos/item.dto';
import { IItemDao } from '../../persistence/dao/item-dao.interface';
import { FindAllItemQueryDto } from './dtos/find-all-item.dto';
import { FindAllItem } from './find-all-item.service';

describe('FindAllItem', () => {
  let sut: FindAllItem;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ItemModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllItem);
    prisma = module.get(PrismaService);

    await prisma.owner.deleteMany();
    await prisma.item.deleteMany();
  });

  afterAll(async() => {
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

      sut = new FindAllItem(mockItemDao);
    });

    it('should return paginated items successfully', async() => {
      // Arrange
      const total = 2;
      const mockItems: ItemDto[] = [
        createMock<ItemDto>(),
        createMock<ItemDto>(),
      ];
      mockItemDao.findAll.mockResolvedValue([mockItems, total]);

      const queryDto = createMock<FindAllItemQueryDto>({ page: 1, size: 10 });

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(mockItemDao.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toBeDefined();
      expect(result).toEqual<IPagination<ItemDto>>({
        data: mockItems,
        totalItems: total,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
      });
    });

    it('should return empty result when no items found', async() => {
      // Arrange
      mockItemDao.findAll.mockResolvedValue([[], 0]);
      const queryDto = createMock<FindAllItemQueryDto>({ page: 1, size: 10 });

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(mockItemDao.findAll).toHaveBeenCalledWith(queryDto);
      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(0);
    });

    it('should pass search parameter to dao', async() => {
      // Arrange
      mockItemDao.findAll.mockResolvedValue([[], 0]);
      const queryDto = createMock<FindAllItemQueryDto>({ page: 1, size: 10 });

      // Act
      await sut.execute(queryDto);

      // Assert
      expect(mockItemDao.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should propagate dao errors', async() => {
      // Arrange
      const daoError = new Error('Database connection failed');
      const queryDto = createMock<FindAllItemQueryDto>({ page: 1, size: 10 });
      mockItemDao.findAll.mockRejectedValue(daoError);

      // Act & Assert
      await expect(sut.execute(queryDto)).rejects.toThrow('Database connection failed');
      expect(mockItemDao.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle large datasets with correct pagination', async() => {
      // Arrange
      const mockItems: ItemDto[] = Array.from({ length: 3 }, (_, index) => ({
        id: `item-${index + 1}`,
        ownerId: 'owner-1',
        description: `Item ${index + 1}`,
        serviceCode: `SKU-${String(index + 1).padStart(3, '0')}`,
        quantity: index + 1,
        unitPriceInCents: (index + 1) * 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const total = 1000; // Large dataset
      mockItemDao.findAll.mockResolvedValue([mockItems, total]);

      const queryDto: FindAllItemQueryDto = {
        ownerId: 'owner-1',
        page: 10,
        size: 100,
        search: '',
      };

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.totalItems).toBe(1000);
      expect(result.currentPage).toBe(10);
      expect(result.itemsPerPage).toBe(100);
      expect(result.totalPages).toBe(10); // Math.ceil(1000/100)
    });
  });

  describe('Integration Tests', () => {
    let existingOwner: OwnerDto;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: { id: 'find-all-test-owner' },
      });
    });

    it('should find all items for owner with real database', async() => {
      // Arrange - Create test items
      await Promise.all([
        prisma.item.create({
          data: {
            id: 'integration-item-1',
            ownerId: existingOwner.id,
            description: 'Integration Test Item 1',
            serviceCode: 'INT-SKU-001',
            quantity: 2,
            unitPriceInCents: 15000,
          },
        }),
        prisma.item.create({
          data: {
            id: 'integration-item-2',
            ownerId: existingOwner.id,
            description: 'Integration Test Item 2',
            serviceCode: 'INT-SKU-002',
            quantity: 1,
            unitPriceInCents: 8500,
          },
        }),
        prisma.item.create({
          data: {
            id: 'integration-item-3',
            ownerId: existingOwner.id,
            description: 'Integration Test Item 3',
            serviceCode: 'INT-SKU-003',
            quantity: 5,
            unitPriceInCents: 3200,
          },
        }),
      ]);

      const queryDto: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 1,
        size: 10,
        search: '',
      };

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.totalItems).toBe(3);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(1);

      // Verify item properties
      const items = result.data;
      expect(items.some(item => item.description === 'Integration Test Item 1')).toBe(true);
      expect(items.some(item => item.description === 'Integration Test Item 2')).toBe(true);
      expect(items.some(item => item.description === 'Integration Test Item 3')).toBe(true);
      expect(items.every(item => item.ownerId === existingOwner.id)).toBe(true);
    });

    it('should return empty result when owner has no items', async() => {
      // Arrange
      const emptyOwner = await prisma.owner.create({
        data: { id: 'empty-owner' },
      });

      const queryDto: FindAllItemQueryDto = {
        ownerId: emptyOwner.id,
        page: 1,
        size: 10,
        search: '',
      };

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(0);
    });

    it('should not return items from other owners', async() => {
      // Arrange - Create another owner with items
      const otherOwner = await prisma.owner.create({
        data: { id: 'other-owner' },
      });

      await prisma.item.create({
        data: {
          id: 'other-owner-item',
          ownerId: otherOwner.id,
          description: 'Other Owner Item',
          serviceCode: 'OTHER-001',
          quantity: 1,
          unitPriceInCents: 5000,
        },
      });

      await prisma.item.create({
        data: {
          id: 'existing-owner-item',
          ownerId: existingOwner.id,
          description: 'Existing Owner Item',
          serviceCode: 'EXISTING-001',
          quantity: 1,
          unitPriceInCents: 3000,
        },
      });

      const queryDto: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 1,
        size: 10,
        search: '',
      };

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].ownerId).toBe(existingOwner.id);
      expect(result.data[0].description).toBe('Existing Owner Item');
    });

    it('should handle pagination correctly with real database', async() => {
      // Arrange - Create many items for pagination testing
      const items = Array.from({ length: 15 }, (_, index) => ({
        id: `paginated-item-${index + 1}`,
        ownerId: existingOwner.id,
        description: `Paginated Item ${index + 1}`,
        serviceCode: `PAG-${String(index + 1).padStart(3, '0')}`,
        quantity: 1,
        unitPriceInCents: (index + 1) * 1000,
      }));

      await prisma.item.createMany({
        data: items,
      });

      // Act - First page
      const firstPageQuery: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 1,
        size: 5,
        search: '',
      };

      const firstPageResult = await sut.execute(firstPageQuery);

      // Act - Second page
      const secondPageQuery: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 2,
        size: 5,
        search: '',
      };

      const secondPageResult = await sut.execute(secondPageQuery);

      // Act - Last page
      const lastPageQuery: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 3,
        size: 5,
        search: '',
      };

      const lastPageResult = await sut.execute(lastPageQuery);

      // Assert
      expect(firstPageResult.data).toHaveLength(5);
      expect(firstPageResult.totalItems).toBe(15);
      expect(firstPageResult.currentPage).toBe(1);
      expect(firstPageResult.totalPages).toBe(3);

      expect(secondPageResult.data).toHaveLength(5);
      expect(secondPageResult.totalItems).toBe(15);
      expect(secondPageResult.currentPage).toBe(2);
      expect(secondPageResult.totalPages).toBe(3);

      expect(lastPageResult.data).toHaveLength(5);
      expect(lastPageResult.totalItems).toBe(15);
      expect(lastPageResult.currentPage).toBe(3);
      expect(lastPageResult.totalPages).toBe(3);

      // Verify no duplicate items across pages
      const allItemIds = [
        ...firstPageResult.data.map(item => item.id),
        ...secondPageResult.data.map(item => item.id),
        ...lastPageResult.data.map(item => item.id),
      ];

      const uniqueIds = new Set(allItemIds);
      expect(uniqueIds.size).toBe(15);
    });

    it('should filter by search parameter', async() => {
      // Arrange - Create items with different descriptions
      await Promise.all([
        prisma.item.create({
          data: {
            id: 'searchable-item-1',
            ownerId: existingOwner.id,
            description: 'Apple Product',
            serviceCode: 'APPLE-001',
            quantity: 1,
            unitPriceInCents: 5000,
          },
        }),
        prisma.item.create({
          data: {
            id: 'searchable-item-2',
            ownerId: existingOwner.id,
            description: 'Orange Juice',
            serviceCode: 'ORANGE-001',
            quantity: 1,
            unitPriceInCents: 3000,
          },
        }),
        prisma.item.create({
          data: {
            id: 'searchable-item-3',
            ownerId: existingOwner.id,
            description: 'Banana Smoothie',
            serviceCode: 'BANANA-001',
            quantity: 1,
            unitPriceInCents: 4000,
          },
        }),
      ]);

      // Act - Search for "Apple"
      const searchQuery: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 1,
        size: 10,
        search: 'Apple',
      };

      const result = await sut.execute(searchQuery);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].description).toBe('Apple Product');
      expect(result.totalItems).toBe(1);
    });

    it('should handle items with boundary values', async() => {
      // Arrange - Create items with edge case values
      await Promise.all([
        prisma.item.create({
          data: {
            id: 'boundary-item-1',
            ownerId: existingOwner.id,
            description: 'Free Item',
            serviceCode: 'FREE-001',
            quantity: 1,
            unitPriceInCents: 0, // Minimum price
          },
        }),
        prisma.item.create({
          data: {
            id: 'boundary-item-2',
            ownerId: existingOwner.id,
            description: 'High Value Item',
            serviceCode: 'HIGH-001',
            quantity: 999, // High quantity
            unitPriceInCents: 999999, // High price
          },
        }),
      ]);

      const queryDto: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 1,
        size: 10,
        search: '',
      };

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.some(item => item.unitPriceInCents === 0)).toBe(true);
      expect(result.data.some(item => item.unitPriceInCents === 999999)).toBe(true);
      expect(result.data.some(item => item.quantity === 999)).toBe(true);
    });

    it('should handle items with special characters', async() => {
      // Arrange
      await prisma.item.create({
        data: {
          id: 'special-char-item',
          ownerId: existingOwner.id,
          description: 'Item with special chars: ãçñü & symbols @#$%',
          serviceCode: 'SP-CHAR-001',
          quantity: 1,
          unitPriceInCents: 2500,
        },
      });

      const queryDto: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 1,
        size: 10,
        search: '',
      };

      // Act
      const result = await sut.execute(queryDto);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].description).toBe('Item with special chars: ãçñü & symbols @#$%');
      expect(result.data[0].serviceCode).toBe('SP-CHAR-001');
    });

    it('should return items in consistent order', async() => {
      // Arrange - Create items with different creation times
      const baseTime = new Date();

      await prisma.item.create({
        data: {
          id: 'order-item-1',
          ownerId: existingOwner.id,
          description: 'First Item',
          serviceCode: 'ORDER-001',
          quantity: 1,
          unitPriceInCents: 1000,
          createdAt: new Date(baseTime.getTime() - 2000),
        },
      });

      await prisma.item.create({
        data: {
          id: 'order-item-2',
          ownerId: existingOwner.id,
          description: 'Second Item',
          serviceCode: 'ORDER-002',
          quantity: 1,
          unitPriceInCents: 2000,
          createdAt: new Date(baseTime.getTime() - 1000),
        },
      });

      await prisma.item.create({
        data: {
          id: 'order-item-3',
          ownerId: existingOwner.id,
          description: 'Third Item',
          serviceCode: 'ORDER-003',
          quantity: 1,
          unitPriceInCents: 3000,
          createdAt: baseTime,
        },
      });

      const queryDto: FindAllItemQueryDto = {
        ownerId: existingOwner.id,
        page: 1,
        size: 10,
        search: '',
      };

      // Act - Call multiple times to verify consistent ordering
      const result1 = await sut.execute(queryDto);
      const result2 = await sut.execute(queryDto);

      // Assert
      expect(result1.data).toHaveLength(3);
      expect(result2.data).toHaveLength(3);

      // Verify both results have same order
      for (let i = 0; i < result1.data.length; i++) {
        expect(result1.data[i].id).toBe(result2.data[i].id);
      }
    });
  });
});
