import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAttendanceDto } from 'src/app/client/client-attendance/application/dtos/client-attendance.dto';
import { CreateClientAttendance } from 'src/app/client/client-attendance/application/usecases/create-client-attendance/create-client-attendance.service';
import { CreateClientAttendanceInputDto, CreateClientAttendanceOutputDto } from 'src/app/client/client-attendance/application/usecases/create-client-attendance/dtos/create-client-attendance.dto';
import { DeleteClientAttendance } from 'src/app/client/client-attendance/application/usecases/delete-client-attendance/delete-client-attendance.service';
import { EditClientAttendanceInputDto } from 'src/app/client/client-attendance/application/usecases/edit-client-attendance/dtos/edit-client-attendance.dto';
import { EditClientAttendance } from 'src/app/client/client-attendance/application/usecases/edit-client-attendance/edit-client-attendance.service';
import { FindAllClientAttendanceQueryDto } from 'src/app/client/client-attendance/application/usecases/find-all-client-attendance/dtos/find-all-client-attendance.dto';
import { FindAllClientAttendance } from 'src/app/client/client-attendance/application/usecases/find-all-client-attendance/find-all-client-attendance.service';
import { FindClientAttendanceById } from 'src/app/client/client-attendance/application/usecases/find-client-attendance-by-id/find-client-attendance-by-id.service';
import { UpdateClientAttendanceStatus } from 'src/app/client/client-attendance/application/usecases/update-client-attendance-status/update-client-attendance-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAttendanceAdminController } from './client-attendance-admin.controller';

describe('ClientAttendanceAdminController - Unit tests', () => {
  let sut: ClientAttendanceAdminController;
  let createClientAttendanceService: CreateClientAttendance;
  let findAllClientAttendanceService: FindAllClientAttendance;
  let findClientAttendanceByIdService: FindClientAttendanceById;
  let editClientAttendanceService: EditClientAttendance;
  let updateClientAttendanceStatusService: UpdateClientAttendanceStatus;
  let deleteClientAttendanceService: DeleteClientAttendance;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientAttendanceAdminController],
      providers: [
        { provide: CreateClientAttendance, useValue: createMock<CreateClientAttendance>() },
        { provide: FindAllClientAttendance, useValue: createMock<FindAllClientAttendance>() },
        { provide: FindClientAttendanceById, useValue: createMock<FindClientAttendanceById>() },
        { provide: EditClientAttendance, useValue: createMock<EditClientAttendance>() },
        { provide: UpdateClientAttendanceStatus, useValue: createMock<UpdateClientAttendanceStatus>() },
        { provide: DeleteClientAttendance, useValue: createMock<DeleteClientAttendance>() },
      ],
    }).compile();

    sut = module.get(ClientAttendanceAdminController);
    createClientAttendanceService = module.get(CreateClientAttendance);
    findAllClientAttendanceService = module.get(FindAllClientAttendance);
    findClientAttendanceByIdService = module.get(FindClientAttendanceById);
    editClientAttendanceService = module.get(EditClientAttendance);
    updateClientAttendanceStatusService = module.get(UpdateClientAttendanceStatus);
    deleteClientAttendanceService = module.get(DeleteClientAttendance);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientAttendance.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientAttendanceInputDto>();
      const output = createMock<CreateClientAttendanceOutputDto>();
      const createSpy = jest.spyOn(createClientAttendanceService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientAttendance.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientAttendanceQueryDto>();
      const output = createMock<IPagination<ClientAttendanceDto>>();
      const findAllSpy = jest.spyOn(findAllClientAttendanceService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientAttendanceById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientAttendanceDto>();
      const findOneSpy = jest.spyOn(findClientAttendanceByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientAttendanceStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientAttendanceStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientAttendance.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientAttendanceInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientAttendanceService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientAttendance.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientAttendanceService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
