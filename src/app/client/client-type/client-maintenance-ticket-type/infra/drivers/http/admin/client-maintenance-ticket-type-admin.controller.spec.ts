import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientMaintenanceTicketTypeDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/dtos/client-maintenance-ticket-type.dto';
import { CreateClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/create-client-maintenance-ticket-type/create-client-maintenance-ticket-type.service';
import { CreateClientMaintenanceTicketTypeInputDto, CreateClientMaintenanceTicketTypeOutputDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/create-client-maintenance-ticket-type/dtos/create-client-maintenance-ticket-type.dto';
import { DeleteClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/delete-client-maintenance-ticket-type/delete-client-maintenance-ticket-type.service';
import { EditClientMaintenanceTicketTypeInputDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/edit-client-maintenance-ticket-type/dtos/edit-client-maintenance-ticket-type.dto';
import { EditClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/edit-client-maintenance-ticket-type/edit-client-maintenance-ticket-type.service';
import { FindAllClientMaintenanceTicketTypeQueryDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-all-client-maintenance-ticket-type/dtos/find-all-client-maintenance-ticket-type.dto';
import { FindAllClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-all-client-maintenance-ticket-type/find-all-client-maintenance-ticket-type.service';
import { FindClientMaintenanceTicketTypeById } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-client-maintenance-ticket-type-by-id/find-client-maintenance-ticket-type-by-id.service';
import { UpdateClientMaintenanceTicketTypeStatus } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/update-client-maintenance-ticket-type-status/update-client-maintenance-ticket-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientMaintenanceTicketTypeAdminController } from './client-maintenance-ticket-type-admin.controller';

describe('ClientMaintenanceTicketTypeAdminController - Unit tests', () => {
  let sut: ClientMaintenanceTicketTypeAdminController;
  let createClientMaintenanceTicketTypeService: CreateClientMaintenanceTicketType;
  let findAllClientMaintenanceTicketTypeService: FindAllClientMaintenanceTicketType;
  let findClientMaintenanceTicketTypeByIdService: FindClientMaintenanceTicketTypeById;
  let editClientMaintenanceTicketTypeService: EditClientMaintenanceTicketType;
  let updateClientMaintenanceTicketTypeStatusService: UpdateClientMaintenanceTicketTypeStatus;
  let deleteClientMaintenanceTicketTypeService: DeleteClientMaintenanceTicketType;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientMaintenanceTicketTypeAdminController],
      providers: [
        { provide: CreateClientMaintenanceTicketType, useValue: createMock<CreateClientMaintenanceTicketType>() },
        { provide: FindAllClientMaintenanceTicketType, useValue: createMock<FindAllClientMaintenanceTicketType>() },
        { provide: FindClientMaintenanceTicketTypeById, useValue: createMock<FindClientMaintenanceTicketTypeById>() },
        { provide: EditClientMaintenanceTicketType, useValue: createMock<EditClientMaintenanceTicketType>() },
        { provide: UpdateClientMaintenanceTicketTypeStatus, useValue: createMock<UpdateClientMaintenanceTicketTypeStatus>() },
        { provide: DeleteClientMaintenanceTicketType, useValue: createMock<DeleteClientMaintenanceTicketType>() },
      ],
    }).compile();

    sut = module.get(ClientMaintenanceTicketTypeAdminController);
    createClientMaintenanceTicketTypeService = module.get(CreateClientMaintenanceTicketType);
    findAllClientMaintenanceTicketTypeService = module.get(FindAllClientMaintenanceTicketType);
    findClientMaintenanceTicketTypeByIdService = module.get(FindClientMaintenanceTicketTypeById);
    editClientMaintenanceTicketTypeService = module.get(EditClientMaintenanceTicketType);
    updateClientMaintenanceTicketTypeStatusService = module.get(UpdateClientMaintenanceTicketTypeStatus);
    deleteClientMaintenanceTicketTypeService = module.get(DeleteClientMaintenanceTicketType);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientMaintenanceTicketType.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientMaintenanceTicketTypeInputDto>();
      const output = createMock<CreateClientMaintenanceTicketTypeOutputDto>();
      const createSpy = jest.spyOn(createClientMaintenanceTicketTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientMaintenanceTicketType.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientMaintenanceTicketTypeQueryDto>();
      const output = createMock<IPagination<ClientMaintenanceTicketTypeDto>>();
      const findAllSpy = jest.spyOn(findAllClientMaintenanceTicketTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientMaintenanceTicketTypeById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientMaintenanceTicketTypeDto>();
      const findOneSpy = jest.spyOn(findClientMaintenanceTicketTypeByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientMaintenanceTicketTypeStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientMaintenanceTicketTypeStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientMaintenanceTicketType.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientMaintenanceTicketTypeInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientMaintenanceTicketTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientMaintenanceTicketType.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientMaintenanceTicketTypeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
