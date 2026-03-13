import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientSystemTypeDto } from 'src/app/client/client-system-type/application/dtos/client-system-type.dto';
import { CreateClientSystemType } from 'src/app/client/client-system-type/application/usecases/create-client-system-type/create-client-system-type.service';
import { CreateClientSystemTypeInputDto, CreateClientSystemTypeOutputDto } from 'src/app/client/client-system-type/application/usecases/create-client-system-type/dtos/create-client-system-type.dto';
import { DeleteClientSystemType } from 'src/app/client/client-system-type/application/usecases/delete-client-system-type/delete-client-system-type.service';
import { EditClientSystemTypeInputDto } from 'src/app/client/client-system-type/application/usecases/edit-client-system-type/dtos/edit-client-system-type.dto';
import { EditClientSystemType } from 'src/app/client/client-system-type/application/usecases/edit-client-system-type/edit-client-system-type.service';
import { FindAllClientSystemTypeQueryDto } from 'src/app/client/client-system-type/application/usecases/find-all-client-system-type/dtos/find-all-client-system-type.dto';
import { FindAllClientSystemType } from 'src/app/client/client-system-type/application/usecases/find-all-client-system-type/find-all-client-system-type.service';
import { FindClientSystemTypeById } from 'src/app/client/client-system-type/application/usecases/find-client-system-type-by-id/find-client-system-type-by-id.service';
import { UpdateClientSystemTypeStatus } from 'src/app/client/client-system-type/application/usecases/update-client-system-type-status/update-client-system-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientSystemTypeAdminController } from './client-system-type-admin.controller';

describe('ClientSystemTypeAdminController - Unit tests', () => {
  let sut: ClientSystemTypeAdminController;
  let createClientSystemTypeService: CreateClientSystemType;
  let findAllClientSystemTypeService: FindAllClientSystemType;
  let findClientSystemTypeByIdService: FindClientSystemTypeById;
  let editClientSystemTypeService: EditClientSystemType;
  let updateClientSystemTypeStatusService: UpdateClientSystemTypeStatus;
  let deleteClientSystemTypeService: DeleteClientSystemType;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientSystemTypeAdminController],
      providers: [
        { provide: CreateClientSystemType, useValue: createMock<CreateClientSystemType>() },
        { provide: FindAllClientSystemType, useValue: createMock<FindAllClientSystemType>() },
        { provide: FindClientSystemTypeById, useValue: createMock<FindClientSystemTypeById>() },
        { provide: EditClientSystemType, useValue: createMock<EditClientSystemType>() },
        { provide: UpdateClientSystemTypeStatus, useValue: createMock<UpdateClientSystemTypeStatus>() },
        { provide: DeleteClientSystemType, useValue: createMock<DeleteClientSystemType>() },
      ],
    }).compile();

    sut = module.get(ClientSystemTypeAdminController);
    createClientSystemTypeService = module.get(CreateClientSystemType);
    findAllClientSystemTypeService = module.get(FindAllClientSystemType);
    findClientSystemTypeByIdService = module.get(FindClientSystemTypeById);
    editClientSystemTypeService = module.get(EditClientSystemType);
    updateClientSystemTypeStatusService = module.get(UpdateClientSystemTypeStatus);
    deleteClientSystemTypeService = module.get(DeleteClientSystemType);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientSystemType.execute with body', async() => {
      const body = createMock<CreateClientSystemTypeInputDto>();
      const output = createMock<CreateClientSystemTypeOutputDto>();
      const createSpy = jest.spyOn(createClientSystemTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientSystemType.execute with queries', async() => {
      const queries = createMock<FindAllClientSystemTypeQueryDto>();
      const output = createMock<IPagination<ClientSystemTypeDto>>();
      const findAllSpy = jest.spyOn(findAllClientSystemTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientSystemTypeById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientSystemTypeDto>();
      const findOneSpy = jest.spyOn(findClientSystemTypeByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientSystemTypeStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientSystemTypeStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientSystemType.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientSystemTypeInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientSystemTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientSystemType.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientSystemTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
