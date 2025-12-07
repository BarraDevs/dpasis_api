import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ItemDto } from 'src/app/item/application/dtos/item.dto';
import { CreateItemInputDto, CreateItemsInputDto, CreateItemsOutputDto } from 'src/app/item/application/usecases/create-item/dtos/create-item.dto';
import { EditItemInputDto } from 'src/app/item/application/usecases/edit-item/dtos/edit-item.dto';
import { FindAllItemQueryDto } from 'src/app/item/application/usecases/find-all-item/dtos/find-all-item.dto';
import { ItemModule } from 'src/app/item/item.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ItemController } from './item.controller';

describe('ItemController', () => {
  let sut: ItemController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ItemModule,
      ],
    }).compile();

    sut = module.get(ItemController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createItemsService.execute with correct input', async() => {
      const item = createMock<CreateItemInputDto>();
      const input = createMock<CreateItemsInputDto>({ items: [item] });
      const output = createMock<CreateItemsOutputDto>();
      const createItemsServiceSpy = jest.spyOn(sut['createItemsService'], 'execute').mockResolvedValue(output);

      await sut.create(input);

      expect(createItemsServiceSpy).toHaveBeenCalledWith(input);
    });
  });

  describe('findAll', () => {
    it('should call findAllItemService.execute with correct queries', async() => {
      const queries = createMock<FindAllItemQueryDto>();
      const output = createMock<IPagination<ItemDto>>();
      const findAllItemServiceSpy = jest.spyOn(sut['findAllItemService'], 'execute').mockResolvedValue(output);

      await sut.findAll(queries);

      expect(findAllItemServiceSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findItemByIdService.execute with correct id', async() => {
      const params = createMock<Params>();
      const output = createMock<ItemDto>();
      const findItemByIdServiceSpy = jest.spyOn(sut['findItemByIdService'], 'execute').mockResolvedValue(output);

      await sut.findOne(params);

      expect(findItemByIdServiceSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editItemService.execute with correct id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditItemInputDto>();
      const output = createMock<SuccessMessage>();
      const editItemServiceSpy = jest.spyOn(sut['editItemService'], 'execute').mockResolvedValue(output);

      await sut.update(params, body);

      expect(editItemServiceSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteItemService.execute with correct id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deleteItemServiceSpy = jest.spyOn(sut['deleteItemService'], 'execute').mockResolvedValue(output);

      await sut.remove(params);

      expect(deleteItemServiceSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
