import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { ItemNotFoundError } from 'src/app/item/domain/errors/item-not-found.error';
import { ItemModule } from 'src/app/item/item.module';
import { OwnerDto } from 'src/app/owner/application/dtos/owner.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ItemDto } from '../../dtos/item.dto';
import { IItemDao } from '../../persistence/dao/item-dao.interface';
import { IItemRepository } from '../../persistence/repository/item-repository.interface';
import { EditItemInputDto } from './dtos/edit-item.dto';
import { EditItem } from './edit-item.service';

describe('EditItem', () => {
  let sut: EditItem;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ItemModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditItem);
    prisma = module.get(PrismaService);

    await prisma.truncate();
  });

  afterEach(async() => {
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

      sut = new EditItem(mockItemDao, mockItemRepository);
    });

    it('should edit item successfully when item exists', async() => {
      // Arrange
      const itemId = 'valid-item-id';
      const existingItemDto = createMock<ItemDto>({
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const editData = createMock<EditItemInputDto>({ quantity: 1, unitPriceInCents: 1000 });

      mockItemDao.findById.mockResolvedValue(existingItemDto);
      mockItemRepository.edit.mockResolvedValue(undefined);

      // Act
      const result = await sut.execute(itemId, editData);

      // Assert
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.edit).toHaveBeenCalledWith(expect.any(Item));
      expect(result).toEqual({ message: 'Item atualizado com sucesso!' });
    });

    it('should throw ItemNotFoundError when item does not exist', async() => {
      // Arrange
      const itemId = 'non-existent-item-id';
      const editData = createMock<EditItemInputDto>();
      mockItemDao.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(itemId, editData)).rejects.toThrow(ItemNotFoundError);
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.edit).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async() => {
      // Arrange
      const itemId = 'valid-item-id';
      const existingItemDto = createMock<ItemDto>({
        quantity: 2,
        unitPriceInCents: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const editData = createMock<EditItemInputDto>();
      mockItemDao.findById.mockResolvedValue(existingItemDto);
      const repositoryError = new Error('Database update failed');
      mockItemRepository.edit.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(sut.execute(itemId, editData)).rejects.toThrow('Database update failed');
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.edit).toHaveBeenCalled();
    });

    it('should propagate dao errors', async() => {
      // Arrange
      const itemId = 'test-item-id';
      const editData = createMock<EditItemInputDto>();
      const daoError = new Error('Database query failed');
      mockItemDao.findById.mockRejectedValue(daoError);

      // Act & Assert
      await expect(sut.execute(itemId, editData)).rejects.toThrow('Database query failed');
      expect(mockItemDao.findById).toHaveBeenCalledWith(itemId);
      expect(mockItemRepository.edit).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    let existingOwner: OwnerDto;
    let existingItem: ItemDto;

    beforeEach(async() => {
      existingOwner = await prisma.owner.create({
        data: {
          id: 'edit-test-owner',
          active: true,
        },
      });

      existingItem = await prisma.item.create({
        data: {
          id: 'edit-test-item',
          ownerId: existingOwner.id,
          description: 'Original Item Description',
          serviceCode: 'ORIGINAL-001',
          quantity: 2,
          unitPriceInCents: 10000,
        },
      });
    });

    it('should edit existing item successfully in database', async() => {
      // Arrange
      const editData: EditItemInputDto = {
        description: 'Updated Item Description',
        serviceCode: 'UPDATED-001',
        quantity: 5,
        unitPriceInCents: 25000,
      };

      // Act
      const result = await sut.execute(existingItem.id, editData);

      // Assert
      expect(result).toEqual({ message: 'Item atualizado com sucesso!' });

      // Verify item was updated in database
      const updatedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(updatedItem).not.toBeNull();
      expect(updatedItem?.description).toBe('Updated Item Description');
      expect(updatedItem?.serviceCode).toBe('UPDATED-001');
      expect(updatedItem?.quantity).toBe(5);
      expect(updatedItem?.unitPriceInCents).toBe(25000);
      expect(updatedItem?.ownerId).toBe(existingOwner.id); // Should remain unchanged
    });

    it('should not change ownerId even when provided in input', async() => {
      // Arrange
      const newOwner = await prisma.owner.create({
        data: { id: 'edit-test-owner-2', active: true },
      });

      const editData = {
        ownerId: newOwner.id,
        description: 'Attempt Owner Change',
      } as EditItemInputDto;

      // Act
      await sut.execute(existingItem.id, editData);

      // Assert
      const updatedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(updatedItem?.description).toBe('Attempt Owner Change');
      expect(updatedItem?.ownerId).toBe(existingOwner.id);
    });

    it('should throw ItemNotFoundError for non-existent item in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-item-id';
      const editData: EditItemInputDto = {
        description: 'This should fail',
      };

      // Act & Assert
      await expect(sut.execute(nonExistentId, editData)).rejects.toThrow(ItemNotFoundError);

      // Verify existing item was not affected
      const originalItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });
      expect(originalItem?.description).toBe('Original Item Description');
    });

    it('should edit some fields while keeping others unchanged', async() => {
      // Arrange
      const editData: EditItemInputDto = {
        description: 'Only Description Changed',
        quantity: 5,
      };

      // Act
      const result = await sut.execute(existingItem.id, editData);

      // Assert
      expect(result.message).toBe('Item atualizado com sucesso!');

      const updatedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(updatedItem?.description).toBe('Only Description Changed');
      expect(updatedItem?.quantity).toBe(5); // Changed
      expect(updatedItem?.serviceCode).toBe('ORIGINAL-001'); // Unchanged
      expect(updatedItem?.unitPriceInCents).toBe(10000); // Unchanged
    });

    it('should handle empty edit data without making changes', async() => {
      // Arrange
      const editData: EditItemInputDto = {};

      // Act
      const result = await sut.execute(existingItem.id, editData);

      // Assert
      expect(result.message).toBe('Item atualizado com sucesso!');

      const updatedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      // All fields should remain the same
      expect(updatedItem).toEqual<ItemDto>({
        ...existingItem,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle items with special characters and boundary values', async() => {
      // Arrange
      const specialItem = await prisma.item.create({
        data: {
          id: 'special-edit-item',
          ownerId: existingOwner.id,
          description: 'Original with special chars: ãçñü',
          serviceCode: 'SPECIAL-001',
          quantity: 1,
          unitPriceInCents: 0,
        },
      });

      const editData: EditItemInputDto = {
        description: 'Updated with special chars: ãçñü & symbols @#$%',
        quantity: 999,
        unitPriceInCents: 999999,
      };

      // Act
      await sut.execute(specialItem.id, editData);

      // Assert
      const updatedItem = await prisma.item.findUnique({
        where: { id: specialItem.id },
      });

      expect(updatedItem?.description).toBe('Updated with special chars: ãçñü & symbols @#$%');
      expect(updatedItem?.quantity).toBe(999);
      expect(updatedItem?.unitPriceInCents).toBe(999999);
    });

    it('should not affect other items when editing one item', async() => {
      // Arrange
      const otherItem = await prisma.item.create({
        data: {
          id: 'other-item-id',
          ownerId: existingOwner.id,
          description: 'Other Item',
          serviceCode: 'OTHER-001',
          quantity: 3,
          unitPriceInCents: 15000,
        },
      });

      const editData: EditItemInputDto = {
        description: 'Edited Item Description',
        quantity: 10,
      };

      // Act
      await sut.execute(existingItem.id, editData);

      // Assert
      const editedItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      const unchangedItem = await prisma.item.findUnique({
        where: { id: otherItem.id },
      });

      // Edited item should have new values
      expect(editedItem?.description).toBe('Edited Item Description');
      expect(editedItem?.quantity).toBe(10);

      // Other item should remain unchanged
      expect(unchangedItem?.description).toBe('Other Item');
      expect(unchangedItem?.quantity).toBe(3);
      expect(unchangedItem?.unitPriceInCents).toBe(15000);
    });

    it('should handle multiple sequential edits correctly', async() => {
      // Act - First edit
      await sut.execute(existingItem.id, {
        description: 'First Edit',
        quantity: 5,
      });

      // Act - Second edit
      await sut.execute(existingItem.id, {
        serviceCode: 'SECOND-EDIT-001',
        unitPriceInCents: 20000,
      });

      // Act - Third edit
      await sut.execute(existingItem.id, {
        description: 'Final Edit',
      });

      // Assert
      const finalItem = await prisma.item.findUnique({
        where: { id: existingItem.id },
      });

      expect(finalItem?.description).toBe('Final Edit');
      expect(finalItem?.serviceCode).toBe('SECOND-EDIT-001');
      expect(finalItem?.quantity).toBe(5);
      expect(finalItem?.unitPriceInCents).toBe(20000);
    });
  });
});
