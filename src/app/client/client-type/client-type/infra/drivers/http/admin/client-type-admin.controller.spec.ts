import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientTypeDto } from 'src/app/client/client-type/client-type/application/dtos/client-type.dto';
import { CreateClientType } from 'src/app/client/client-type/client-type/application/usecases/create-client-type/create-client-type.service';
import { CreateClientTypeInputDto, CreateClientTypeOutputDto } from 'src/app/client/client-type/client-type/application/usecases/create-client-type/dtos/create-client-type.dto';
import { DeleteBulkClientType } from 'src/app/client/client-type/client-type/application/usecases/delete-bulk-client-type/delete-bulk-client-type.service';
import { DeleteBulkClientTypeInputDto, DeleteBulkClientTypeOutputDto } from 'src/app/client/client-type/client-type/application/usecases/delete-bulk-client-type/dtos/delete-bulk-client-type.dto';
import { DeleteClientType } from 'src/app/client/client-type/client-type/application/usecases/delete-client-type/delete-client-type.service';
import { EditClientTypeInputDto } from 'src/app/client/client-type/client-type/application/usecases/edit-client-type/dtos/edit-client-type.dto';
import { EditClientType } from 'src/app/client/client-type/client-type/application/usecases/edit-client-type/edit-client-type.service';
import { FindAllClientTypeQueryDto } from 'src/app/client/client-type/client-type/application/usecases/find-all-client-type/dtos/find-all-client-type.dto';
import { FindAllClientType } from 'src/app/client/client-type/client-type/application/usecases/find-all-client-type/find-all-client-type.service';
import { FindClientTypeById } from 'src/app/client/client-type/client-type/application/usecases/find-client-type-by-id/find-client-type-by-id.service';
import { UpdateClientTypeStatus } from 'src/app/client/client-type/client-type/application/usecases/update-client-type-status/update-client-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientTypeAdminController } from './client-type-admin.controller';

describe('ClientTypeAdminController', () => {
  let sut: ClientTypeAdminController;
  let createClientTypeService: CreateClientType;
  let findAllClientTypeService: FindAllClientType;
  let findClientTypeByIdService: FindClientTypeById;
  let editClientTypeService: EditClientType;
  let updateClientTypeStatusService: UpdateClientTypeStatus;
  let deleteClientTypeService: DeleteClientType;
  let deleteBulkClientTypeService: DeleteBulkClientType;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientTypeAdminController],
      providers: [
        { provide: CreateClientType, useValue: createMock<CreateClientType>() },
        { provide: FindAllClientType, useValue: createMock<FindAllClientType>() },
        { provide: FindClientTypeById, useValue: createMock<FindClientTypeById>() },
        { provide: EditClientType, useValue: createMock<EditClientType>() },
        { provide: UpdateClientTypeStatus, useValue: createMock<UpdateClientTypeStatus>() },
        { provide: DeleteClientType, useValue: createMock<DeleteClientType>() },
        { provide: DeleteBulkClientType, useValue: createMock<DeleteBulkClientType>() },
      ],
    }).compile();

    sut = module.get(ClientTypeAdminController);
    createClientTypeService = module.get(CreateClientType);
    findAllClientTypeService = module.get(FindAllClientType);
    findClientTypeByIdService = module.get(FindClientTypeById);
    editClientTypeService = module.get(EditClientType);
    updateClientTypeStatusService = module.get(UpdateClientTypeStatus);
    deleteClientTypeService = module.get(DeleteClientType);
    deleteBulkClientTypeService = module.get(DeleteBulkClientType);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientType.execute with body', async() => {
      const body = createMock<CreateClientTypeInputDto>();
      const output = createMock<CreateClientTypeOutputDto>();
      const createSpy = jest.spyOn(createClientTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientType.execute with queries', async() => {
      const queries = createMock<FindAllClientTypeQueryDto>();
      const output = createMock<IPagination<ClientTypeDto>>();
      const findAllSpy = jest.spyOn(findAllClientTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientTypeById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientTypeDto>();
      const findOneSpy = jest.spyOn(findClientTypeByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientTypeStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientTypeStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientType.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientTypeInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('removeBulk', () => {
    it('should call deleteBulkClientType.execute with body', async() => {
      const body = createMock<DeleteBulkClientTypeInputDto>({ ids: [] });
      const output = createMock<DeleteBulkClientTypeOutputDto>({ succeeded: [], failed: [] });
      const removeBulkSpy = jest.spyOn(deleteBulkClientTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.removeBulk(body);

      expect(result).toEqual(output);
      expect(removeBulkSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientType.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
