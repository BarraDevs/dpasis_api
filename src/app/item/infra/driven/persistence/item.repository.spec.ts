import { Test } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { ItemPersistenceModule } from 'src/app/item/application/persistence/item-persistence.module';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ItemRepositoryAdapterPrisma } from './item.repository';

describe('ItemRepositoryAdapterPrisma', () => {
  let sut: ItemRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ItemPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ItemRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ItemRepositoryAdapterPrisma);
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

  describe('createMany', () => {
    let existingOwner: Owner;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: { id: 'repository-test-owner' },
      });
    });

    it('should create multiple items successfully', async() => {
      // Arrange
      const items: Item[] = [
        Item.create({
          ownerId: existingOwner.id,
          description: 'Item 1',
          serviceCode: 'SKU-001',
          quantity: 2,
          unitPriceInCents: 10000,
        }),
        Item.create({
          ownerId: existingOwner.id,
          description: 'Item 2',
          serviceCode: 'SKU-002',
          quantity: 1,
          unitPriceInCents: 5000,
        }),
        Item.create({
          ownerId: existingOwner.id,
          description: 'Item 3',
          serviceCode: 'SKU-003',
          quantity: 3,
          unitPriceInCents: 15000,
        }),
      ];

      // Act
      await sut.createMany(items);

      // Assert
      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(createdItems).toHaveLength(3);

      // Verify first item
      expect(createdItems[0].id).toBe(items[0].props.id);
      expect(createdItems[0].ownerId).toBe(existingOwner.id);
      expect(createdItems[0].description).toBe('Item 1');
      expect(createdItems[0].serviceCode).toBe('SKU-001');
      expect(createdItems[0].quantity).toBe(2);
      expect(createdItems[0].unitPriceInCents).toBe(10000);

      // Verify second item
      expect(createdItems[1].id).toBe(items[1].props.id);
      expect(createdItems[1].description).toBe('Item 2');
      expect(createdItems[1].serviceCode).toBe('SKU-002');
      expect(createdItems[1].quantity).toBe(1);
      expect(createdItems[1].unitPriceInCents).toBe(5000);

      // Verify third item
      expect(createdItems[2].id).toBe(items[2].props.id);
      expect(createdItems[2].description).toBe('Item 3');
      expect(createdItems[2].serviceCode).toBe('SKU-003');
      expect(createdItems[2].quantity).toBe(3);
      expect(createdItems[2].unitPriceInCents).toBe(15000);
    });

    it('should create single item successfully', async() => {
      // Arrange
      const items: Item[] = [
        Item.create({
          ownerId: existingOwner.id,
          description: 'Single Item',
          serviceCode: 'SKU-SINGLE',
          quantity: 5,
          unitPriceInCents: 25000,
        }),
      ];

      // Act
      await sut.createMany(items);

      // Assert
      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
      });

      expect(createdItems).toHaveLength(1);
      expect(createdItems[0].id).toBe(items[0].props.id);
      expect(createdItems[0].description).toBe('Single Item');
      expect(createdItems[0].serviceCode).toBe('SKU-SINGLE');
      expect(createdItems[0].quantity).toBe(5);
      expect(createdItems[0].unitPriceInCents).toBe(25000);
    });

    it('should handle items with different properties correctly', async() => {
      // Arrange
      const items: Item[] = [
        Item.create({
          ownerId: existingOwner.id,
          description: 'Free Item',
          serviceCode: 'FREE-001',
          quantity: 1,
          unitPriceInCents: 0, // Free item
        }),
        Item.create({
          ownerId: existingOwner.id,
          description: 'Expensive Item',
          serviceCode: 'EXP-001',
          quantity: 999,
          unitPriceInCents: 999999, // Expensive item
        }),
      ];

      // Act
      await sut.createMany(items);

      // Assert
      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
        orderBy: { unitPriceInCents: 'asc' },
      });

      expect(createdItems).toHaveLength(2);
      expect(createdItems[0].unitPriceInCents).toBe(0);
      expect(createdItems[0].quantity).toBe(1);
      expect(createdItems[1].unitPriceInCents).toBe(999999);
      expect(createdItems[1].quantity).toBe(999);
    });

    it('should handle items with special characters in text fields', async() => {
      // Arrange
      const items: Item[] = [
        Item.create({
          ownerId: existingOwner.id,
          description: 'Item with special chars: ãçñü & symbols @#$%',
          serviceCode: 'SP-CHAR-001',
          quantity: 1,
          unitPriceInCents: 1000,
        }),
      ];

      // Act
      await sut.createMany(items);

      // Assert
      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
      });

      expect(createdItems).toHaveLength(1);
      expect(createdItems[0].description).toBe('Item with special chars: ãçñü & symbols @#$%');
      expect(createdItems[0].serviceCode).toBe('SP-CHAR-001');
    });

    it('should handle large batch of items', async() => {
      // Arrange
      const items: Item[] = Array.from({ length: 50 }, (_, index) =>
        Item.create({
          ownerId: existingOwner.id,
          description: `Item ${index + 1}`,
          serviceCode: `SKU-${String(index + 1).padStart(3, '0')}`,
          quantity: index + 1,
          unitPriceInCents: (index + 1) * 1000,
        })
      );

      // Act
      await sut.createMany(items);

      // Assert
      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
      });

      expect(createdItems).toHaveLength(50);

      // Verify some items
      const firstItem = createdItems.find(item => item.description === 'Item 1');
      const lastItem = createdItems.find(item => item.description === 'Item 50');

      expect(firstItem).toBeDefined();
      expect(firstItem?.quantity).toBe(1);
      expect(firstItem?.unitPriceInCents).toBe(1000);

      expect(lastItem).toBeDefined();
      expect(lastItem?.quantity).toBe(50);
      expect(lastItem?.unitPriceInCents).toBe(50000);
    });

    it('should handle empty array gracefully', async() => {
      // Arrange
      const items: Item[] = [];

      // Act
      await sut.createMany(items);

      // Assert
      const createdItems = await prisma.item.findMany({
        where: { ownerId: existingOwner.id },
      });

      expect(createdItems).toHaveLength(0);
    });

    it('should throw error when trying to create items with duplicate IDs', async() => {
      // Arrange
      const itemId = 'duplicate-id-test';
      const items: Item[] = [
        Item.load({
          id: itemId,
          ownerId: existingOwner.id,
          description: 'First Item',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Item.load({
          id: itemId, // Same ID
          ownerId: existingOwner.id,
          description: 'Second Item',
          serviceCode: 'SKU-002',
          quantity: 2,
          unitPriceInCents: 2000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      // Act & Assert
      await expect(sut.createMany(items)).rejects.toThrow();
    });
  });

  describe('edit', () => {
    let existingOwner: any;
    let existingItem: any;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: { id: 'repository-edit-test-owner' },
      });

      existingItem = await prisma.item.create({
        data: {
          id: 'repository-edit-test-item',
          ownerId: existingOwner.id,
          description: 'Original Description',
          serviceCode: 'ORIGINAL-001',
          quantity: 1,
          unitPriceInCents: 5000,
        },
      });
    });

    it('should update item successfully', async() => {
      // Arrange
      const updatedItem = Item.load({
        id: existingItem.id,
        ownerId: existingOwner.id,
        description: 'Updated Description',
        serviceCode: 'UPDATED-001',
        quantity: 3,
        unitPriceInCents: 15000,
        createdAt: existingItem.createdAt,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedItem);

      // Assert
      const itemFromDb = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(itemFromDb).not.toBeNull();
      expect(itemFromDb?.description).toBe('Updated Description');
      expect(itemFromDb?.serviceCode).toBe('UPDATED-001');
      expect(itemFromDb?.quantity).toBe(3);
      expect(itemFromDb?.unitPriceInCents).toBe(15000);
      expect(itemFromDb?.ownerId).toBe(existingOwner.id); // Should remain unchanged
      expect(itemFromDb?.updatedAt.getTime()).toBeGreaterThan(itemFromDb?.createdAt.getTime() || 0);
    });

    it('should update only description while keeping other fields unchanged', async() => {
      // Arrange
      const updatedItem = Item.load({
        id: existingItem.id,
        ownerId: existingItem.ownerId,
        description: 'Only Description Changed',
        serviceCode: existingItem.serviceCode, // Keep original
        quantity: existingItem.quantity, // Keep original
        unitPriceInCents: existingItem.unitPriceInCents, // Keep original
        createdAt: existingItem.createdAt,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedItem);

      // Assert
      const itemFromDb = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(itemFromDb?.description).toBe('Only Description Changed');
      expect(itemFromDb?.serviceCode).toBe('ORIGINAL-001'); // Unchanged
      expect(itemFromDb?.quantity).toBe(1); // Unchanged
      expect(itemFromDb?.unitPriceInCents).toBe(5000); // Unchanged
    });

    it('should update to minimum valid values', async() => {
      // Arrange
      const updatedItem = Item.load({
        id: existingItem.id,
        ownerId: existingOwner.id,
        description: 'Free Item',
        serviceCode: 'FREE-001',
        quantity: 1, // Minimum quantity
        unitPriceInCents: 0, // Minimum price (free)
        createdAt: existingItem.createdAt,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedItem);

      // Assert
      const itemFromDb = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(itemFromDb?.quantity).toBe(1);
      expect(itemFromDb?.unitPriceInCents).toBe(0);
      expect(itemFromDb?.description).toBe('Free Item');
    });

    it('should update to maximum valid values', async() => {
      // Arrange
      const updatedItem = Item.load({
        id: existingItem.id,
        ownerId: existingOwner.id,
        description: 'Expensive Item with High Quantity',
        serviceCode: 'EXP-HIGH-001',
        quantity: 999, // High quantity
        unitPriceInCents: 999999, // High price
        createdAt: existingItem.createdAt,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedItem);

      // Assert
      const itemFromDb = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(itemFromDb?.quantity).toBe(999);
      expect(itemFromDb?.unitPriceInCents).toBe(999999);
      expect(itemFromDb?.description).toBe('Expensive Item with High Quantity');
    });

    it('should handle special characters in text fields during update', async() => {
      // Arrange
      const updatedItem = Item.load({
        id: existingItem.id,
        ownerId: existingOwner.id,
        description: 'Updated with special chars: ãçñü & symbols @#$%',
        serviceCode: 'SP-CHAR-UPD',
        quantity: existingItem.quantity,
        unitPriceInCents: existingItem.unitPriceInCents,
        createdAt: existingItem.createdAt,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedItem);

      // Assert
      const itemFromDb = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(itemFromDb?.description).toBe('Updated with special chars: ãçñü & symbols @#$%');
      expect(itemFromDb?.serviceCode).toBe('SP-CHAR-UPD');
    });

    it('should throw error when trying to update non-existent item', async() => {
      // Arrange
      const nonExistentItem = Item.load({
        id: 'non-existent-item-id',
        ownerId: existingOwner.id,
        description: 'This should fail',
        serviceCode: 'FAIL-001',
        quantity: 1,
        unitPriceInCents: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(nonExistentItem)).rejects.toThrow();
    });

    it('should not affect other items when updating one item', async() => {
      // Arrange - Create another item
      const otherItem = await prisma.item.create({
        data: {
          id: 'other-item-id',
          ownerId: existingOwner.id,
          description: 'Other Item',
          serviceCode: 'OTHER-001',
          quantity: 2,
          unitPriceInCents: 3000,
        },
      });

      const updatedItem = Item.load({
        id: existingItem.id,
        ownerId: existingOwner.id,
        description: 'Updated Description',
        serviceCode: 'UPDATED-001',
        quantity: 5,
        unitPriceInCents: 10000,
        createdAt: existingItem.createdAt,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedItem);

      // Assert
      const updatedItemFromDb = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      const otherItemFromDb = await prisma.item.findUnique({
        where: { id: otherItem.id },
      });

      // Updated item should have new values
      expect(updatedItemFromDb?.description).toBe('Updated Description');
      expect(updatedItemFromDb?.quantity).toBe(5);

      // Other item should remain unchanged
      expect(otherItemFromDb?.description).toBe('Other Item');
      expect(otherItemFromDb?.quantity).toBe(2);
      expect(otherItemFromDb?.unitPriceInCents).toBe(3000);
    });
  });

  describe('delete', () => {
    let existingOwner: any;
    let existingItem: any;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: { id: 'repository-delete-test-owner' },
      });

      existingItem = await prisma.item.create({
        data: {
          id: 'repository-delete-test-item',
          ownerId: existingOwner.id,
          description: 'Item to be deleted',
          serviceCode: 'DELETE-001',
          quantity: 1,
          unitPriceInCents: 5000,
        },
      });
    });

    it('should delete item successfully', async() => {
      // Act
      await sut.delete(existingItem.id);

      // Assert
      const deletedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(deletedItem).toBeNull();
    });

    it('should throw error when trying to delete non-existent item', async() => {
      // Act & Assert
      await expect(sut.delete('non-existent-item-id')).rejects.toThrow();
    });

    it('should throw error when trying to delete with empty id', async() => {
      // Act & Assert
      await expect(sut.delete('')).rejects.toThrow();
    });

    it('should not affect other items when deleting one item', async() => {
      // Arrange - Create additional items
      const item2 = await prisma.item.create({
        data: {
          id: 'item-to-keep-1',
          ownerId: existingOwner.id,
          description: 'Item to keep 1',
          serviceCode: 'KEEP-001',
          quantity: 2,
          unitPriceInCents: 3000,
        },
      });

      const item3 = await prisma.item.create({
        data: {
          id: 'item-to-keep-2',
          ownerId: existingOwner.id,
          description: 'Item to keep 2',
          serviceCode: 'KEEP-002',
          quantity: 3,
          unitPriceInCents: 4000,
        },
      });

      // Act
      await sut.delete(existingItem.id);

      // Assert
      const deletedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      const keptItem1 = await prisma.item.findUnique({
        where: { id: item2.id },
      });

      const keptItem2 = await prisma.item.findUnique({
        where: { id: item3.id },
      });

      expect(deletedItem).toBeNull();
      expect(keptItem1).not.toBeNull();
      expect(keptItem2).not.toBeNull();
      expect(keptItem1?.description).toBe('Item to keep 1');
      expect(keptItem2?.description).toBe('Item to keep 2');
    });

    it('should handle deletion of items with different properties', async() => {
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

      // Act
      await sut.delete(freeItem.id);
      await sut.delete(expensiveItem.id);

      // Assert
      const deletedFreeItem = await prisma.item.findUnique({
        where: { id: freeItem.id },
      });

      const deletedExpensiveItem = await prisma.item.findUnique({
        where: { id: expensiveItem.id },
      });

      expect(deletedFreeItem).toBeNull();
      expect(deletedExpensiveItem).toBeNull();
    });
  });
});
