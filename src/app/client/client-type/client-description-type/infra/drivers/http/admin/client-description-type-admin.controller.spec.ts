import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDescriptionTypeDto } from 'src/app/client/client-type/client-description-type/application/dtos/client-description-type.dto';
import { CreateClientDescriptionType } from 'src/app/client/client-type/client-description-type/application/usecases/create-client-description-type/create-client-description-type.service';
import { CreateClientDescriptionTypeInputDto, CreateClientDescriptionTypeOutputDto } from 'src/app/client/client-type/client-description-type/application/usecases/create-client-description-type/dtos/create-client-description-type.dto';
import { DeleteClientDescriptionType } from 'src/app/client/client-type/client-description-type/application/usecases/delete-client-description-type/delete-client-description-type.service';
import { EditClientDescriptionTypeInputDto } from 'src/app/client/client-type/client-description-type/application/usecases/edit-client-description-type/dtos/edit-client-description-type.dto';
import { EditClientDescriptionType } from 'src/app/client/client-type/client-description-type/application/usecases/edit-client-description-type/edit-client-description-type.service';
import { FindAllClientDescriptionTypeQueryDto } from 'src/app/client/client-type/client-description-type/application/usecases/find-all-client-description-type/dtos/find-all-client-description-type.dto';
import { FindAllClientDescriptionType } from 'src/app/client/client-type/client-description-type/application/usecases/find-all-client-description-type/find-all-client-description-type.service';
import { FindClientDescriptionTypeById } from 'src/app/client/client-type/client-description-type/application/usecases/find-client-description-type-by-id/find-client-description-type-by-id.service';
import { UpdateClientDescriptionTypeStatus } from 'src/app/client/client-type/client-description-type/application/usecases/update-client-description-type-status/update-client-description-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDescriptionTypeAdminController } from './client-description-type-admin.controller';

describe('ClientDescriptionTypeAdminController - Unit tests', () => {
  let sut: ClientDescriptionTypeAdminController;
  let createClientDescriptionTypeService: CreateClientDescriptionType;
  let findAllClientDescriptionTypeService: FindAllClientDescriptionType;
  let findClientDescriptionTypeByIdService: FindClientDescriptionTypeById;
  let editClientDescriptionTypeService: EditClientDescriptionType;
  let updateClientDescriptionTypeStatusService: UpdateClientDescriptionTypeStatus;
  let deleteClientDescriptionTypeService: DeleteClientDescriptionType;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientDescriptionTypeAdminController],
      providers: [
        { provide: CreateClientDescriptionType, useValue: createMock<CreateClientDescriptionType>() },
        { provide: FindAllClientDescriptionType, useValue: createMock<FindAllClientDescriptionType>() },
        { provide: FindClientDescriptionTypeById, useValue: createMock<FindClientDescriptionTypeById>() },
        { provide: EditClientDescriptionType, useValue: createMock<EditClientDescriptionType>() },
        { provide: UpdateClientDescriptionTypeStatus, useValue: createMock<UpdateClientDescriptionTypeStatus>() },
        { provide: DeleteClientDescriptionType, useValue: createMock<DeleteClientDescriptionType>() },
      ],
    }).compile();

    sut = module.get(ClientDescriptionTypeAdminController);
    createClientDescriptionTypeService = module.get(CreateClientDescriptionType);
    findAllClientDescriptionTypeService = module.get(FindAllClientDescriptionType);
    findClientDescriptionTypeByIdService = module.get(FindClientDescriptionTypeById);
    editClientDescriptionTypeService = module.get(EditClientDescriptionType);
    updateClientDescriptionTypeStatusService = module.get(UpdateClientDescriptionTypeStatus);
    deleteClientDescriptionTypeService = module.get(DeleteClientDescriptionType);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientDescriptionType.execute with body', async() => {
      const body = createMock<CreateClientDescriptionTypeInputDto>();
      const output = createMock<CreateClientDescriptionTypeOutputDto>();
      const createSpy = jest.spyOn(createClientDescriptionTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientDescriptionType.execute with queries', async() => {
      const queries = createMock<FindAllClientDescriptionTypeQueryDto>();
      const output = createMock<IPagination<ClientDescriptionTypeDto>>();
      const findAllSpy = jest.spyOn(findAllClientDescriptionTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientDescriptionTypeById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientDescriptionTypeDto>();
      const findOneSpy = jest.spyOn(findClientDescriptionTypeByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientDescriptionTypeStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientDescriptionTypeStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientDescriptionType.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientDescriptionTypeInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientDescriptionTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientDescriptionType.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientDescriptionTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
