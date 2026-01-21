import { Test } from '@nestjs/testing';
import { Item, Owner } from '@prisma/client';
import { ItemDto } from 'src/app/item/application/dtos/item.dto';
import { ItemPersistenceModule } from 'src/app/item/application/persistence/item-persistence.module';
import { FindAllItemQueryDto } from 'src/app/item/application/usecases/find-all-item/dtos/find-all-item.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ItemDaoAdapterPrisma } from './item.dao';

describe('ItemDaoAdapterPrisma', () => {
  let sut: ItemDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ItemPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ItemDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ItemDaoAdapterPrisma);
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

  describe('findAll', () => {
    let owner1: Owner;
    let owner2: Owner;
    let item1: Item;
    let item2: Item;
    let item3: Item;
    let item4: Item;

    beforeEach(async() => {
      owner1 = await prisma.owner.create({
        data: { id: 'owner-dao-01', active: true },
      });

      owner2 = await prisma.owner.create({
        data: { id: 'owner-dao-02', active: true },
      });

      // Create items for owner1
      item1 = await prisma.item.create({
        data: {
          id: 'item-dao-01',
          ownerId: owner1.id,
          description: 'Produto A Premium',
          serviceCode: 'PROD-A-001',
          quantity: 5,
          unitPriceInCents: 25000,
        },
      });

      item2 = await prisma.item.create({
        data: {
          id: 'item-dao-02',
          ownerId: owner1.id,
          description: 'Serviço B Básico',
          serviceCode: 'SERV-B-002',
          quantity: 1,
          unitPriceInCents: 75000,
        },
      });

      item3 = await prisma.item.create({
        data: {
          id: 'item-dao-03',
          ownerId: owner1.id,
          description: 'Item C Standard',
          serviceCode: 'ITEM-C-003',
          quantity: 3,
          unitPriceInCents: 12000,
        },
      });

      // Create item for owner2
      item4 = await prisma.item.create({
        data: {
          id: 'item-dao-04',
          ownerId: owner2.id,
          description: 'Produto D Exclusivo',
          serviceCode: 'PROD-D-004',
          quantity: 2,
          unitPriceInCents: 30000,
        },
      });
    });

    it('should return all items for specific owner without search filter', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(items).toHaveLength(3);
      expect(items.every(item => item.ownerId === owner1.id)).toBe(true);

      const itemIds = items.map(item => item.id);
      expect(itemIds).toContain(item1.id);
      expect(itemIds).toContain(item2.id);
      expect(itemIds).toContain(item3.id);
      expect(itemIds).not.toContain(item4.id); // Different owner
    });

    it('should return items ordered by createdAt desc by default', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
      };

      // Act
      const [items] = await sut.findAll(queries);

      // Assert
      expect(items).toHaveLength(3);
      // item3 was created last, so should be first in desc order
      expect(items[0].id).toBe(item3.id);
    });

    it('should return paginated results correctly', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        page: 1,
        size: 2,
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(items).toHaveLength(2);
    });

    it('should return second page correctly', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        page: 2,
        size: 2,
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(items).toHaveLength(1); // Only 1 item on second page
    });

    it('should filter items by search term in description (case insensitive)', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: 'produto', // Should match "Produto A Premium"
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(item1.id);
      expect(items[0].description).toBe('Produto A Premium');
    });

    it('should filter items by search term in serviceCode (case insensitive)', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: 'serv', // Should match "SERV-B-002"
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(item2.id);
      expect(items[0].serviceCode).toBe('SERV-B-002');
    });

    it('should filter by search term matching either description OR serviceCode', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: 'ITEM', // Should match description "Item C Standard" and serviceCode "ITEM-C-003"
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(item3.id);
    });

    it('should return empty result when no items match search criteria', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: 'NonexistentItem',
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(0);
      expect(items).toHaveLength(0);
    });

    it('should return empty result for owner with no items', async() => {
      // Arrange
      const emptyOwner = await prisma.owner.create({
        data: { id: 'empty-owner', active: true },
      });

      const queries: FindAllItemQueryDto = {
        ownerId: emptyOwner.id,
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(0);
      expect(items).toHaveLength(0);
    });

    it('should return empty result for non-existent owner', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: 'non-existent-owner-id',
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(0);
      expect(items).toHaveLength(0);
    });

    it('should combine pagination with search filter', async() => {
      // Arrange - Add more items to test pagination with search
      await prisma.item.create({
        data: {
          id: 'item-dao-05',
          ownerId: owner1.id,
          description: 'Produto E Extra',
          serviceCode: 'PROD-E-005',
          quantity: 1,
          unitPriceInCents: 5000,
        },
      });

      await prisma.item.create({
        data: {
          id: 'item-dao-06',
          ownerId: owner1.id,
          description: 'Produto F Final',
          serviceCode: 'PROD-F-006',
          quantity: 2,
          unitPriceInCents: 8000,
        },
      });

      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: 'Produto', // Should match 3 items: "Produto A Premium", "Produto E Extra", "Produto F Final"
        page: 1,
        size: 2,
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3); // 3 items with "Produto" in description
      expect(items).toHaveLength(2); // First 2 items due to pagination
    });

    it('should handle empty search parameter gracefully', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: '',
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3); // Should return all items for owner1
      expect(items).toHaveLength(3);
    });

    it('should handle search with special characters', async() => {
      // Arrange - Create item with special characters
      const specialItem = await prisma.item.create({
        data: {
          id: 'item-special',
          ownerId: owner1.id,
          description: 'Item with special chars: ãçñü & symbols @#$%',
          serviceCode: 'SP-CHAR-001',
          quantity: 1,
          unitPriceInCents: 1000,
        },
      });

      const queries: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: 'ãçñü',
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(specialItem.id);
    });

    it('should filter correctly when owner has no items matching search', async() => {
      // Arrange
      const queries: FindAllItemQueryDto = {
        ownerId: owner2.id, // owner2 has only one item with "Produto D Exclusivo"
        search: 'Serviço', // No items match this for owner2
      };

      // Act
      const [items, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(0);
      expect(items).toHaveLength(0);
    });

    it('should return different results for different owners with same search term', async() => {
      // Arrange
      const queries1: FindAllItemQueryDto = {
        ownerId: owner1.id,
        search: 'Produto',
      };

      const queries2: FindAllItemQueryDto = {
        ownerId: owner2.id,
        search: 'Produto',
      };

      // Act
      const [items1, total1] = await sut.findAll(queries1);
      const [items2, total2] = await sut.findAll(queries2);

      // Assert
      expect(total1).toBe(1); // owner1 has "Produto A Premium"
      expect(total2).toBe(1); // owner2 has "Produto D Exclusivo"
      expect(items1[0].ownerId).toBe(owner1.id);
      expect(items2[0].ownerId).toBe(owner2.id);
      expect(items1[0].id).not.toBe(items2[0].id);
    });
  });

  describe('findById', () => {
    let owner: Owner;
    let item: Item;

    beforeEach(async() => {
      owner = await prisma.owner.create({
        data: { id: 'owner-findbyid-test', active: true },
      });

      item = await prisma.item.create({
        data: {
          id: 'item-findbyid-test',
          ownerId: owner.id,
          description: 'Test Item for FindById',
          serviceCode: 'TEST-FINDBYID-001',
          quantity: 2,
          unitPriceInCents: 15000,
        },
      });
    });

    it('should return the correct item when found', async() => {
      // Act
      const result = await sut.findById(item.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(item.id);
      expect(result?.ownerId).toBe(owner.id);
      expect(result?.description).toBe('Test Item for FindById');
      expect(result?.serviceCode).toBe('TEST-FINDBYID-001');
      expect(result?.quantity).toBe(2);
      expect(result?.unitPriceInCents).toBe(15000);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null when item is not found', async() => {
      // Act
      const result = await sut.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when id is empty string', async() => {
      // Act
      const result = await sut.findById('');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when id is malformed UUID', async() => {
      // Act
      const result = await sut.findById('invalid-uuid-format');

      // Assert
      expect(result).toBeNull();
    });

    it('should return correct item even when multiple items exist', async() => {
      // Arrange - Create additional items
      const item2 = await prisma.item.create({
        data: {
          id: 'item-findbyid-test-2',
          ownerId: owner.id,
          description: 'Second Test Item',
          serviceCode: 'TEST-FINDBYID-002',
          quantity: 1,
          unitPriceInCents: 5000,
        },
      });

      const item3 = await prisma.item.create({
        data: {
          id: 'item-findbyid-test-3',
          ownerId: owner.id,
          description: 'Third Test Item',
          serviceCode: 'TEST-FINDBYID-003',
          quantity: 3,
          unitPriceInCents: 8000,
        },
      });

      // Act
      const result = await sut.findById(item2.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(item2.id);
      expect(result?.description).toBe('Second Test Item');
      expect(result?.serviceCode).toBe('TEST-FINDBYID-002');

      // Should not return data from other items
      expect(result?.id).not.toBe(item.id);
      expect(result?.id).not.toBe(item3.id);
    });

    it('should return item with all expected properties and correct types', async() => {
      // Act
      const result = await sut.findById(item.id);

      // Assert - Verify all properties are present
      expect(result).toEqual<ItemDto>({
        id: item.id,
        ownerId: item.ownerId,
        description: item.description,
        serviceCode: item.serviceCode,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    });

    it('should handle items with different owners correctly', async() => {
      // Arrange - Create another owner and item
      const owner2 = await prisma.owner.create({
        data: { id: 'owner-findbyid-test-2', active: true },
      });

      const item2 = await prisma.item.create({
        data: {
          id: 'item-different-owner-test',
          ownerId: owner2.id,
          description: 'Item from different owner',
          serviceCode: 'DIFF-OWNER-001',
          quantity: 1,
          unitPriceInCents: 3000,
        },
      });

      // Act
      const result1 = await sut.findById(item.id);
      const result2 = await sut.findById(item2.id);

      // Assert
      expect(result1?.id).toBe(item.id);
      expect(result1?.ownerId).toBe(owner.id);

      expect(result2?.id).toBe(item2.id);
      expect(result2?.ownerId).toBe(owner2.id);
    });

    it('should handle items with edge case values', async() => {
      // Arrange - Create items with minimum and maximum values
      const freeItem = await prisma.item.create({
        data: {
          id: 'free-item-test',
          ownerId: owner.id,
          description: 'Free item',
          serviceCode: 'FREE-001',
          quantity: 0,
          unitPriceInCents: 0, // Minimum price
        },
      });

      const expensiveItem = await prisma.item.create({
        data: {
          id: 'expensive-item-test',
          ownerId: owner.id,
          description: 'Expensive item',
          serviceCode: 'EXP-001',
          quantity: 999, // High quantity
          unitPriceInCents: 999999, // High price
        },
      });

      // Act
      const freeResult = await sut.findById(freeItem.id);
      const expensiveResult = await sut.findById(expensiveItem.id);

      // Assert
      expect(freeResult?.unitPriceInCents).toBe(0);
      expect(freeResult?.quantity).toBe(0);

      expect(expensiveResult?.unitPriceInCents).toBe(999999);
      expect(expensiveResult?.quantity).toBe(999);
    });

    it('should handle items with special characters in description and serviceCode', async() => {
      // Arrange
      const specialItem = await prisma.item.create({
        data: {
          id: 'special-chars-item-test',
          ownerId: owner.id,
          description: 'Item with special chars: ãçñü & symbols @#$%',
          serviceCode: 'SP-CHAR-001',
          quantity: 1,
          unitPriceInCents: 1000,
        },
      });

      // Act
      const result = await sut.findById(specialItem.id);

      // Assert
      expect(result?.description).toBe('Item with special chars: ãçñü & symbols @#$%');
      expect(result?.serviceCode).toBe('SP-CHAR-001');
    });
  });
});
