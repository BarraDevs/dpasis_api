import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAttendanceTypeDto } from 'src/app/client/client-attendance-type/application/dtos/client-attendance-type.dto';
import { CreateClientAttendanceType } from 'src/app/client/client-attendance-type/application/usecases/create-client-attendance-type/create-client-attendance-type.service';
import { CreateClientAttendanceTypeInputDto, CreateClientAttendanceTypeOutputDto } from 'src/app/client/client-attendance-type/application/usecases/create-client-attendance-type/dtos/create-client-attendance-type.dto';
import { DeleteClientAttendanceType } from 'src/app/client/client-attendance-type/application/usecases/delete-client-attendance-type/delete-client-attendance-type.service';
import { EditClientAttendanceTypeInputDto } from 'src/app/client/client-attendance-type/application/usecases/edit-client-attendance-type/dtos/edit-client-attendance-type.dto';
import { EditClientAttendanceType } from 'src/app/client/client-attendance-type/application/usecases/edit-client-attendance-type/edit-client-attendance-type.service';
import { FindAllClientAttendanceTypeQueryDto } from 'src/app/client/client-attendance-type/application/usecases/find-all-client-attendance-type/dtos/find-all-client-attendance-type.dto';
import { FindAllClientAttendanceType } from 'src/app/client/client-attendance-type/application/usecases/find-all-client-attendance-type/find-all-client-attendance-type.service';
import { FindClientAttendanceTypeById } from 'src/app/client/client-attendance-type/application/usecases/find-client-attendance-type-by-id/find-client-attendance-type-by-id.service';
import { UpdateClientAttendanceTypeStatus } from 'src/app/client/client-attendance-type/application/usecases/update-client-attendance-type-status/update-client-attendance-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAttendanceTypeAdminController } from './client-attendance-type-admin.controller';

describe('ClientAttendanceTypeAdminController - Unit tests', () => {
  let sut: ClientAttendanceTypeAdminController;
  let createClientAttendanceTypeService: CreateClientAttendanceType;
  let findAllClientAttendanceTypeService: FindAllClientAttendanceType;
  let findClientAttendanceTypeByIdService: FindClientAttendanceTypeById;
  let editClientAttendanceTypeService: EditClientAttendanceType;
  let updateClientAttendanceTypeStatusService: UpdateClientAttendanceTypeStatus;
  let deleteClientAttendanceTypeService: DeleteClientAttendanceType;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientAttendanceTypeAdminController],
      providers: [
        { provide: CreateClientAttendanceType, useValue: createMock<CreateClientAttendanceType>() },
        { provide: FindAllClientAttendanceType, useValue: createMock<FindAllClientAttendanceType>() },
        { provide: FindClientAttendanceTypeById, useValue: createMock<FindClientAttendanceTypeById>() },
        { provide: EditClientAttendanceType, useValue: createMock<EditClientAttendanceType>() },
        { provide: UpdateClientAttendanceTypeStatus, useValue: createMock<UpdateClientAttendanceTypeStatus>() },
        { provide: DeleteClientAttendanceType, useValue: createMock<DeleteClientAttendanceType>() },
      ],
    }).compile();

    sut = module.get(ClientAttendanceTypeAdminController);
    createClientAttendanceTypeService = module.get(CreateClientAttendanceType);
    findAllClientAttendanceTypeService = module.get(FindAllClientAttendanceType);
    findClientAttendanceTypeByIdService = module.get(FindClientAttendanceTypeById);
    editClientAttendanceTypeService = module.get(EditClientAttendanceType);
    updateClientAttendanceTypeStatusService = module.get(UpdateClientAttendanceTypeStatus);
    deleteClientAttendanceTypeService = module.get(DeleteClientAttendanceType);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientAttendanceType.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientAttendanceTypeInputDto>();
      const output = createMock<CreateClientAttendanceTypeOutputDto>();
      const createSpy = jest.spyOn(createClientAttendanceTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientAttendanceType.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientAttendanceTypeQueryDto>();
      const output = createMock<IPagination<ClientAttendanceTypeDto>>();
      const findAllSpy = jest.spyOn(findAllClientAttendanceTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientAttendanceTypeById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientAttendanceTypeDto>();
      const findOneSpy = jest.spyOn(findClientAttendanceTypeByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientAttendanceTypeStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientAttendanceTypeStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientAttendanceType.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientAttendanceTypeInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientAttendanceTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientAttendanceType.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientAttendanceTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
