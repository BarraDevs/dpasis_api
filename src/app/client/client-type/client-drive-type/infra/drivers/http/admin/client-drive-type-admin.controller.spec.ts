import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDriveTypeDto } from 'src/app/client/client-type/client-drive-type/application/dtos/client-drive-type.dto';
import { CreateClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/create-client-drive-type/create-client-drive-type.service';
import { CreateClientDriveTypeInputDto, CreateClientDriveTypeOutputDto } from 'src/app/client/client-type/client-drive-type/application/usecases/create-client-drive-type/dtos/create-client-drive-type.dto';
import { DeleteClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/delete-client-drive-type/delete-client-drive-type.service';
import { EditClientDriveTypeInputDto } from 'src/app/client/client-type/client-drive-type/application/usecases/edit-client-drive-type/dtos/edit-client-drive-type.dto';
import { EditClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/edit-client-drive-type/edit-client-drive-type.service';
import { FindAllClientDriveTypeQueryDto } from 'src/app/client/client-type/client-drive-type/application/usecases/find-all-client-drive-type/dtos/find-all-client-drive-type.dto';
import { FindAllClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/find-all-client-drive-type/find-all-client-drive-type.service';
import { FindClientDriveTypeById } from 'src/app/client/client-type/client-drive-type/application/usecases/find-client-drive-type-by-id/find-client-drive-type-by-id.service';
import { UpdateClientDriveTypeStatus } from 'src/app/client/client-type/client-drive-type/application/usecases/update-client-drive-type-status/update-client-drive-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDriveTypeAdminController } from './client-drive-type-admin.controller';

describe('ClientDriveTypeAdminController - Unit tests', () => {
  let sut: ClientDriveTypeAdminController;
  let createClientDriveTypeService: CreateClientDriveType;
  let findAllClientDriveTypeService: FindAllClientDriveType;
  let findClientDriveTypeByIdService: FindClientDriveTypeById;
  let editClientDriveTypeService: EditClientDriveType;
  let updateClientDriveTypeStatusService: UpdateClientDriveTypeStatus;
  let deleteClientDriveTypeService: DeleteClientDriveType;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientDriveTypeAdminController],
      providers: [
        { provide: CreateClientDriveType, useValue: createMock<CreateClientDriveType>() },
        { provide: FindAllClientDriveType, useValue: createMock<FindAllClientDriveType>() },
        { provide: FindClientDriveTypeById, useValue: createMock<FindClientDriveTypeById>() },
        { provide: EditClientDriveType, useValue: createMock<EditClientDriveType>() },
        { provide: UpdateClientDriveTypeStatus, useValue: createMock<UpdateClientDriveTypeStatus>() },
        { provide: DeleteClientDriveType, useValue: createMock<DeleteClientDriveType>() },
      ],
    }).compile();

    sut = module.get(ClientDriveTypeAdminController);
    createClientDriveTypeService = module.get(CreateClientDriveType);
    findAllClientDriveTypeService = module.get(FindAllClientDriveType);
    findClientDriveTypeByIdService = module.get(FindClientDriveTypeById);
    editClientDriveTypeService = module.get(EditClientDriveType);
    updateClientDriveTypeStatusService = module.get(UpdateClientDriveTypeStatus);
    deleteClientDriveTypeService = module.get(DeleteClientDriveType);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientDriveType.execute with body', async() => {
      const body = createMock<CreateClientDriveTypeInputDto>();
      const output = createMock<CreateClientDriveTypeOutputDto>();
      const createSpy = jest.spyOn(createClientDriveTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientDriveType.execute with queries', async() => {
      const queries = createMock<FindAllClientDriveTypeQueryDto>();
      const output = createMock<IPagination<ClientDriveTypeDto>>();
      const findAllSpy = jest.spyOn(findAllClientDriveTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientDriveTypeById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientDriveTypeDto>();
      const findOneSpy = jest.spyOn(findClientDriveTypeByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientDriveTypeStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientDriveTypeStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientDriveType.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientDriveTypeInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientDriveTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientDriveType.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientDriveTypeService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
