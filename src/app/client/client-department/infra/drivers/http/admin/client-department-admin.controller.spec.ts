import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDepartmentDto } from 'src/app/client/client-department/application/dtos/client-department.dto';
import { CreateClientDepartment } from 'src/app/client/client-department/application/usecases/create-client-department/create-client-department.service';
import { CreateClientDepartmentInputDto, CreateClientDepartmentOutputDto } from 'src/app/client/client-department/application/usecases/create-client-department/dtos/create-client-department.dto';
import { DeleteClientDepartment } from 'src/app/client/client-department/application/usecases/delete-client-department/delete-client-department.service';
import { EditClientDepartmentInputDto } from 'src/app/client/client-department/application/usecases/edit-client-department/dtos/edit-client-department.dto';
import { EditClientDepartment } from 'src/app/client/client-department/application/usecases/edit-client-department/edit-client-department.service';
import { FindAllClientDepartmentQueryDto } from 'src/app/client/client-department/application/usecases/find-all-client-department/dtos/find-all-client-department.dto';
import { FindAllClientDepartment } from 'src/app/client/client-department/application/usecases/find-all-client-department/find-all-client-department.service';
import { FindClientDepartmentById } from 'src/app/client/client-department/application/usecases/find-client-department-by-id/find-client-department-by-id.service';
import { UpdateClientDepartmentStatus } from 'src/app/client/client-department/application/usecases/update-client-department-status/update-client-department-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDepartmentAdminController } from './client-department-admin.controller';

describe('ClientDepartmentAdminController - Unit tests', () => {
  let sut: ClientDepartmentAdminController;
  let createClientDepartmentService: CreateClientDepartment;
  let findAllClientDepartmentService: FindAllClientDepartment;
  let findClientDepartmentByIdService: FindClientDepartmentById;
  let editClientDepartmentService: EditClientDepartment;
  let updateClientDepartmentStatusService: UpdateClientDepartmentStatus;
  let deleteClientDepartmentService: DeleteClientDepartment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientDepartmentAdminController],
      providers: [
        { provide: CreateClientDepartment, useValue: createMock<CreateClientDepartment>() },
        { provide: FindAllClientDepartment, useValue: createMock<FindAllClientDepartment>() },
        { provide: FindClientDepartmentById, useValue: createMock<FindClientDepartmentById>() },
        { provide: EditClientDepartment, useValue: createMock<EditClientDepartment>() },
        { provide: UpdateClientDepartmentStatus, useValue: createMock<UpdateClientDepartmentStatus>() },
        { provide: DeleteClientDepartment, useValue: createMock<DeleteClientDepartment>() },
      ],
    }).compile();

    sut = module.get(ClientDepartmentAdminController);
    createClientDepartmentService = module.get(CreateClientDepartment);
    findAllClientDepartmentService = module.get(FindAllClientDepartment);
    findClientDepartmentByIdService = module.get(FindClientDepartmentById);
    editClientDepartmentService = module.get(EditClientDepartment);
    updateClientDepartmentStatusService = module.get(UpdateClientDepartmentStatus);
    deleteClientDepartmentService = module.get(DeleteClientDepartment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientDepartment.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientDepartmentInputDto>();
      const output = createMock<CreateClientDepartmentOutputDto>();
      const createSpy = jest.spyOn(createClientDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientDepartment.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientDepartmentQueryDto>();
      const output = createMock<IPagination<ClientDepartmentDto>>();
      const findAllSpy = jest.spyOn(findAllClientDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientDepartmentById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientDepartmentDto>();
      const findOneSpy = jest.spyOn(findClientDepartmentByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientDepartmentStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientDepartmentStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientDepartment.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientDepartmentInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientDepartment.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
