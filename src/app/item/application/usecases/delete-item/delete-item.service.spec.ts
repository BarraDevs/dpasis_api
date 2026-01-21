import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ItemNotFoundError } from 'src/app/item/domain/errors/item-not-found.error';
import { ItemModule } from 'src/app/item/item.module';
import { OwnerDto } from 'src/app/owner/application/dtos/owner.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ItemDto } from '../../dtos/item.dto';
import { IItemDao } from '../../persistence/dao/item-dao.interface';
import { IItemRepository } from '../../persistence/repository/item-repository.interface';
import { DeleteItem } from './delete-item.service';

describe('DeleteItem', () => {
  let sut: DeleteItem;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ItemModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(DeleteItem);
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
    let mockItemRepository: jest.Mocked<IItemRepository>;

    beforeEach(() => {
      mockItemDao = {
        findById: jest.fn(),
        findAll: jest.fn(),
      };

      mockItemRepository = {
        createMany: jest.fn(),
        edit: jest.fn(),
        delete: jest.fn(),
      };

      sut = new DeleteItem(mockItemDao, mockItemRepository);
    });

    it('should delete item successfully when item exists', async() => {
      // Arrange
      const itemId = 'valid-item-id';
      const mockItem = createMock<ItemDto>();

      mockItemDao.findById.mockResolvedValue(mockItem);
      mockItemRepository.delete.mockResolvedValue(undefined);

      // Act
      const result = await sut.execute(itemId);

      // Assert
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.delete).toHaveBeenCalledWith(itemId);
      expect(result).toEqual<SuccessMessage>({ message: 'Item deletado com sucesso!' });
    });

    it('should throw ItemNotFoundError when item does not exist', async() => {
      // Arrange
      const itemId = 'non-existent-item-id';
      mockItemDao.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(itemId)).rejects.toThrow(ItemNotFoundError);
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.delete).not.toHaveBeenCalled();
    });

    it('should call findById before attempting to delete', async() => {
      // Arrange
      const itemId = 'test-item-id';
      const mockItem = createMock<ItemDto>();

      mockItemDao.findById.mockResolvedValue(mockItem);
      mockItemRepository.delete.mockResolvedValue(undefined);

      // Act
      await sut.execute(itemId);

      // Assert
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.delete).toHaveBeenCalledWith(itemId);
      expect(mockItemDao.findById).toHaveBeenCalledTimes(1);
      expect(mockItemRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors', async() => {
      // Arrange
      const itemId = 'valid-item-id';
      const mockItem = createMock<ItemDto>();

      mockItemDao.findById.mockResolvedValue(mockItem);
      const repositoryError = new Error('Database connection failed');
      mockItemRepository.delete.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(sut.execute(itemId)).rejects.toThrow('Database connection failed');
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.delete).toHaveBeenCalledWith(itemId);
    });

    it('should propagate dao errors', async() => {
      // Arrange
      const itemId = 'test-item-id';
      const daoError = new Error('Database query failed');
      mockItemDao.findById.mockRejectedValue(daoError);

      // Act & Assert
      await expect(sut.execute(itemId)).rejects.toThrow('Database query failed');
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    let existingOwner: OwnerDto;
    let existingItem: ItemDto;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: {
          id: 'delete-test-owner',
          active: true,
        },
      });

      existingItem = await prisma.item.create({
        data: {
          id: 'delete-test-item',
          ownerId: existingOwner.id,
          description: 'Item to be deleted',
          serviceCode: 'DELETE-001',
          quantity: 1,
          unitPriceInCents: 5000,
        },
      });
    });

    it('should delete existing item successfully from database', async() => {
      // Act
      const result = await sut.execute(existingItem.id);

      // Assert
      expect(result).toEqual({ message: 'Item deletado com sucesso!' });

      // Verify item was deleted from database
      const deletedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });
      expect(deletedItem).toBeNull();
    });

    it('should throw ItemNotFoundError for non-existent item in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-item-id';

      // Act & Assert
      await expect(sut.execute(nonExistentId)).rejects.toThrow(ItemNotFoundError);

      // Verify existing item was not affected
      const stillExistingItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });
      expect(stillExistingItem).not.toBeNull();
    });

    it('should throw ItemNotFoundError for empty string ID', async() => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      await expect(sut.execute(emptyId)).rejects.toThrow(ItemNotFoundError);
    });

    it('should not affect other items when deleting one item', async() => {
      // Arrange - Create additional items
      const additionalItem1 = await prisma.item.create({
        data: {
          id: 'additional-item-1',
          ownerId: existingOwner.id,
          description: 'Item to keep 1',
          serviceCode: 'KEEP-001',
          quantity: 2,
          unitPriceInCents: 3000,
        },
      });

      const additionalItem2 = await prisma.item.create({
        data: {
          id: 'additional-item-2',
          ownerId: existingOwner.id,
          description: 'Item to keep 2',
          serviceCode: 'KEEP-002',
          quantity: 3,
          unitPriceInCents: 4000,
        },
      });

      // Act
      await sut.execute(existingItem.id);

      // Assert
      const deletedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      const keptItem1 = await prisma.item.findUnique({
        where: { id: additionalItem1.id },
      });

      const keptItem2 = await prisma.item.findUnique({
        where: { id: additionalItem2.id },
      });

      expect(deletedItem).toBeNull();
      expect(keptItem1).not.toBeNull();
      expect(keptItem2).not.toBeNull();
      expect(keptItem1?.description).toBe('Item to keep 1');
      expect(keptItem2?.description).toBe('Item to keep 2');
    });

    it('should delete items with different properties successfully', async() => {
      // Arrange - Create items with various properties
      const freeItem = await prisma.item.create({
        data: {
          id: 'free-item-to-delete',
          ownerId: existingOwner.id,
          description: 'Free Item',
          serviceCode: 'FREE-001',
          quantity: 1,
          unitPriceInCents: 0,
        },
      });

      const expensiveItem = await prisma.item.create({
        data: {
          id: 'expensive-item-to-delete',
          ownerId: existingOwner.id,
          description: 'Expensive Item',
          serviceCode: 'EXP-001',
          quantity: 999,
          unitPriceInCents: 999999,
        },
      });

      const specialCharItem = await prisma.item.create({
        data: {
          id: 'special-char-item',
          ownerId: existingOwner.id,
          description: 'Item with special chars: ãçñü & symbols @#$%',
          serviceCode: 'SP-CHAR-001',
          quantity: 5,
          unitPriceInCents: 2500,
        },
      });

      // Act
      const result1 = await sut.execute(freeItem.id);
      const result2 = await sut.execute(expensiveItem.id);
      const result3 = await sut.execute(specialCharItem.id);

      // Assert
      expect(result1.message).toBe('Item deletado com sucesso!');
      expect(result2.message).toBe('Item deletado com sucesso!');
      expect(result3.message).toBe('Item deletado com sucesso!');

      // Verify all items were deleted
      const deletedFreeItem = await prisma.item.findUnique({
        where: { id: freeItem.id },
      });
      const deletedExpensiveItem = await prisma.item.findUnique({
        where: { id: expensiveItem.id },
      });
      const deletedSpecialCharItem = await prisma.item.findUnique({
        where: { id: specialCharItem.id },
      });

      expect(deletedFreeItem).toBeNull();
      expect(deletedExpensiveItem).toBeNull();
      expect(deletedSpecialCharItem).toBeNull();
    });

    it('should maintain data consistency after multiple deletions', async() => {
      // Arrange - Create multiple items
      const items = await Promise.all([
        prisma.item.create({
          data: {
            id: 'item-1-to-delete',
            ownerId: existingOwner.id,
            description: 'Item 1',
            serviceCode: 'ITEM-001',
            quantity: 1,
            unitPriceInCents: 1000,
          },
        }),
        prisma.item.create({
          data: {
            id: 'item-2-to-delete',
            ownerId: existingOwner.id,
            description: 'Item 2',
            serviceCode: 'ITEM-002',
            quantity: 2,
            unitPriceInCents: 2000,
          },
        }),
        prisma.item.create({
          data: {
            id: 'item-3-to-keep',
            ownerId: existingOwner.id,
            description: 'Item 3 - Keep',
            serviceCode: 'ITEM-003',
            quantity: 3,
            unitPriceInCents: 3000,
          },
        }),
      ]);

      // Act - Delete first two items
      await sut.execute(items[0].id);
      await sut.execute(items[1].id);

      // Assert
      const remainingItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
      });

      // Should have existingItem and item-3-to-keep
      expect(remainingItems).toHaveLength(2);

      const keptItemIds = remainingItems.map(item => item.id);
      expect(keptItemIds).toContain(existingItem.id);
      expect(keptItemIds).toContain('item-3-to-keep');
      expect(keptItemIds).not.toContain('item-1-to-delete');
      expect(keptItemIds).not.toContain('item-2-to-delete');
    });

    it('should handle concurrent deletion attempts gracefully', async() => {
      // Arrange
      const itemToDelete = await prisma.item.create({
        data: {
          id: 'concurrent-delete-item',
          ownerId: existingOwner.id,
          description: 'Concurrent Delete Test',
          serviceCode: 'CONCURRENT-001',
          quantity: 1,
          unitPriceInCents: 1000,
        },
      });

      // Act - Try to delete the same item twice (simulating concurrent requests)
      const firstDelete = sut.execute(itemToDelete.id);

      // Wait a bit to ensure first deletion is in progress
      await new Promise(resolve => setTimeout(resolve, 10));

      const secondDelete = sut.execute(itemToDelete.id);

      // Assert
      const [firstResult] = await Promise.allSettled([firstDelete, secondDelete]);

      if (firstResult.status === 'fulfilled') {
        expect(firstResult.value.message).toBe('Item deletado com sucesso!');
      }

      // Verify item was deleted
      const deletedItem = await prisma.item.findUnique({
        where: { id: itemToDelete.id },
      });
      expect(deletedItem).toBeNull();
    });
  });
});
