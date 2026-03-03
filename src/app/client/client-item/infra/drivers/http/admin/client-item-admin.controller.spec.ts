import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientItemNotFoundError } from 'src/app/client/client-item/domain/errors/client-item-not-found.error';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { CreateClientItem } from 'src/app/client/client-item/application/usecases/create-client-item/create-client-item.service';
import {
  CreateClientItemInputDto,
  CreateClientItemOutputDto,
} from 'src/app/client/client-item/application/usecases/create-client-item/dtos/create-client-item.dto';
import { DeleteClientItem } from 'src/app/client/client-item/application/usecases/delete-client-item/delete-client-item.service';
import { EditClientItemInputDto } from 'src/app/client/client-item/application/usecases/edit-client-item/dtos/edit-client-item.dto';
import { EditClientItem } from 'src/app/client/client-item/application/usecases/edit-client-item/edit-client-item.service';
import { FindAllClientItemQueryDto } from 'src/app/client/client-item/application/usecases/find-all-client-item/dtos/find-all-client-item.dto';
import { FindAllClientItem } from 'src/app/client/client-item/application/usecases/find-all-client-item/find-all-client-item.service';
import { FindClientItemById } from 'src/app/client/client-item/application/usecases/find-client-item-by-id/find-client-item-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientItemAdminController } from './client-item-admin.controller';

describe('ClientItemAdminController - Unit tests', () => {
  let sut: ClientItemAdminController;
  let createClientItemService: CreateClientItem;
  let findAllClientItemService: FindAllClientItem;
  let findClientItemByIdService: FindClientItemById;
  let editClientItemService: EditClientItem;
  let deleteClientItemService: DeleteClientItem;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientItemAdminController],
      providers: [
        { provide: CreateClientItem, useValue: createMock<CreateClientItem>() },
        { provide: FindAllClientItem, useValue: createMock<FindAllClientItem>() },
        { provide: FindClientItemById, useValue: createMock<FindClientItemById>() },
        { provide: EditClientItem, useValue: createMock<EditClientItem>() },
        { provide: DeleteClientItem, useValue: createMock<DeleteClientItem>() },
      ],
    }).compile();

    sut = module.get(ClientItemAdminController);
    createClientItemService = module.get(CreateClientItem);
    findAllClientItemService = module.get(FindAllClientItem);
    findClientItemByIdService = module.get(FindClientItemById);
    editClientItemService = module.get(EditClientItem);
    deleteClientItemService = module.get(DeleteClientItem);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientItem.execute with body', async() => {
      const body = createMock<CreateClientItemInputDto>();
      const output = createMock<CreateClientItemOutputDto>();
      const createSpy = jest.spyOn(createClientItemService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientItem.execute with queries', async() => {
      const queries = createMock<FindAllClientItemQueryDto>();
      const output = createMock<IPagination<ClientItemDto>>();
      const findAllSpy = jest.spyOn(findAllClientItemService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientItemById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientItemDto>();
      const findOneSpy = jest.spyOn(findClientItemByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientItem.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientItemInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientItemService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientItem.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientItemService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('error propagation', () => {
    it('should propagate ClientItemNotFoundError from findOne', async() => {
      const params = createMock<Params>();
      jest.spyOn(findClientItemByIdService, 'execute').mockRejectedValue(new ClientItemNotFoundError());

      await expect(sut.findOne(params)).rejects.toThrow(ClientItemNotFoundError);
    });

    it('should propagate ClientItemNotFoundError from update', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientItemInputDto>();
      jest.spyOn(editClientItemService, 'execute').mockRejectedValue(new ClientItemNotFoundError());

      await expect(sut.update(params, body)).rejects.toThrow(ClientItemNotFoundError);
    });

    it('should propagate ClientItemNotFoundError from remove', async() => {
      const params = createMock<Params>();
      jest.spyOn(deleteClientItemService, 'execute').mockRejectedValue(new ClientItemNotFoundError());

      await expect(sut.remove(params)).rejects.toThrow(ClientItemNotFoundError);
    });
  });
});
