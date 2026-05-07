import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientMaintenanceTicketDto } from 'src/app/client/client-maintenance-ticket/application/dtos/client-maintenance-ticket.dto';
import { CreateClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/create-client-maintenance-ticket/create-client-maintenance-ticket.service';
import { CreateClientMaintenanceTicketInputDto, CreateClientMaintenanceTicketOutputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/create-client-maintenance-ticket/dtos/create-client-maintenance-ticket.dto';
import { DeleteClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/delete-client-maintenance-ticket/delete-client-maintenance-ticket.service';
import { EditClientMaintenanceTicketInputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/edit-client-maintenance-ticket/dtos/edit-client-maintenance-ticket.dto';
import { EditClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/edit-client-maintenance-ticket/edit-client-maintenance-ticket.service';
import { FindAllClientMaintenanceTicketQueryDto } from 'src/app/client/client-maintenance-ticket/application/usecases/find-all-client-maintenance-ticket/dtos/find-all-client-maintenance-ticket.dto';
import { FindAllClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/find-all-client-maintenance-ticket/find-all-client-maintenance-ticket.service';
import { FindClientMaintenanceTicketById } from 'src/app/client/client-maintenance-ticket/application/usecases/find-client-maintenance-ticket-by-id/find-client-maintenance-ticket-by-id.service';
import { UpdateClientMaintenanceTicketStatus } from 'src/app/client/client-maintenance-ticket/application/usecases/update-client-maintenance-ticket-status/update-client-maintenance-ticket-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientMaintenanceTicketAdminController } from './client-maintenance-ticket-admin.controller';

describe('ClientMaintenanceTicketAdminController - Unit tests', () => {
  let sut: ClientMaintenanceTicketAdminController;
  let createClientMaintenanceTicketService: CreateClientMaintenanceTicket;
  let findAllClientMaintenanceTicketService: FindAllClientMaintenanceTicket;
  let findClientMaintenanceTicketByIdService: FindClientMaintenanceTicketById;
  let editClientMaintenanceTicketService: EditClientMaintenanceTicket;
  let updateClientMaintenanceTicketStatusService: UpdateClientMaintenanceTicketStatus;
  let deleteClientMaintenanceTicketService: DeleteClientMaintenanceTicket;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientMaintenanceTicketAdminController],
      providers: [
        { provide: CreateClientMaintenanceTicket, useValue: createMock<CreateClientMaintenanceTicket>() },
        { provide: FindAllClientMaintenanceTicket, useValue: createMock<FindAllClientMaintenanceTicket>() },
        { provide: FindClientMaintenanceTicketById, useValue: createMock<FindClientMaintenanceTicketById>() },
        { provide: EditClientMaintenanceTicket, useValue: createMock<EditClientMaintenanceTicket>() },
        { provide: UpdateClientMaintenanceTicketStatus, useValue: createMock<UpdateClientMaintenanceTicketStatus>() },
        { provide: DeleteClientMaintenanceTicket, useValue: createMock<DeleteClientMaintenanceTicket>() },
      ],
    }).compile();

    sut = module.get(ClientMaintenanceTicketAdminController);
    createClientMaintenanceTicketService = module.get(CreateClientMaintenanceTicket);
    findAllClientMaintenanceTicketService = module.get(FindAllClientMaintenanceTicket);
    findClientMaintenanceTicketByIdService = module.get(FindClientMaintenanceTicketById);
    editClientMaintenanceTicketService = module.get(EditClientMaintenanceTicket);
    updateClientMaintenanceTicketStatusService = module.get(UpdateClientMaintenanceTicketStatus);
    deleteClientMaintenanceTicketService = module.get(DeleteClientMaintenanceTicket);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientMaintenanceTicket.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientMaintenanceTicketInputDto>();
      const output = createMock<CreateClientMaintenanceTicketOutputDto>();
      const createSpy = jest.spyOn(createClientMaintenanceTicketService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientMaintenanceTicket.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientMaintenanceTicketQueryDto>();
      const output = createMock<IPagination<ClientMaintenanceTicketDto>>();
      const findAllSpy = jest.spyOn(findAllClientMaintenanceTicketService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientMaintenanceTicketById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientMaintenanceTicketDto>();
      const findOneSpy = jest.spyOn(findClientMaintenanceTicketByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientMaintenanceTicketStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientMaintenanceTicketStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientMaintenanceTicket.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientMaintenanceTicketInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientMaintenanceTicketService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientMaintenanceTicket.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientMaintenanceTicketService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
