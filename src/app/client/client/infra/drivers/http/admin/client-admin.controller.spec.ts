import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { ActivateClient } from 'src/app/client/client/application/usecases/activate-client/activate-client.service';
import { CreateClient } from 'src/app/client/client/application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from 'src/app/client/client/application/usecases/create-client/dtos/create-client.dto';
import { DeactivateClient } from 'src/app/client/client/application/usecases/deactivate-client/deactivate-client.service';
import { EditClientInputDto } from 'src/app/client/client/application/usecases/edit-client/dtos/edit-client.dto';
import { EditClient } from 'src/app/client/client/application/usecases/edit-client/edit-client.service';
import { FindAllClientQueryDto } from 'src/app/client/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindAllClient } from 'src/app/client/client/application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { FindSubClientsQueryDto } from 'src/app/client/client/application/usecases/find-sub-clients/dtos/find-sub-clients.dto';
import { FindSubClients } from 'src/app/client/client/application/usecases/find-sub-clients/find-sub-clients.service';
import { GetClientSequenceOutputDto } from 'src/app/client/client/application/usecases/get-client-sequence/dtos/get-client-sequence.dto';
import { GetClientSequence } from 'src/app/client/client/application/usecases/get-client-sequence/get-client-sequence.service';
import { LinkClientAttendanceAndMaintenanceInputDto } from 'src/app/client/client/application/usecases/link-client-attendance-and-maintenance/dtos/link-client-attendance-and-maintenance.dto';
import { LinkClientAttendanceAndMaintenance } from 'src/app/client/client/application/usecases/link-client-attendance-and-maintenance/link-client-attendance-and-maintenance.service';
import { SetClientNextIdInputDto } from 'src/app/client/client/application/usecases/set-client-next-id/dtos/set-client-next-id.dto';
import { SetClientNextId } from 'src/app/client/client/application/usecases/set-client-next-id/set-client-next-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAdminController } from './client-admin.controller';

describe('ClientAdminController - Unit tests', () => {
  let sut: ClientAdminController;
  let activateClientService: ActivateClient;
  let createClientService: CreateClient;
  let deactivateClientService: DeactivateClient;
  let findAllClientService: FindAllClient;
  let findClientByIdService: FindClientById;
  let findSubClientsService: FindSubClients;
  let editClientService: EditClient;
  let getClientSequenceService: GetClientSequence;
  let linkClientAttendanceAndMaintenanceService: LinkClientAttendanceAndMaintenance;
  let setClientNextIdService: SetClientNextId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientAdminController],
      providers: [
        { provide: ActivateClient, useValue: createMock<ActivateClient>() },
        { provide: CreateClient, useValue: createMock<CreateClient>() },
        { provide: DeactivateClient, useValue: createMock<DeactivateClient>() },
        { provide: FindAllClient, useValue: createMock<FindAllClient>() },
        { provide: FindClientById, useValue: createMock<FindClientById>() },
        { provide: FindSubClients, useValue: createMock<FindSubClients>() },
        { provide: EditClient, useValue: createMock<EditClient>() },
        { provide: GetClientSequence, useValue: createMock<GetClientSequence>() },
        { provide: LinkClientAttendanceAndMaintenance, useValue: createMock<LinkClientAttendanceAndMaintenance>() },
        { provide: SetClientNextId, useValue: createMock<SetClientNextId>() },
      ],
    }).compile();

    sut = module.get(ClientAdminController);
    activateClientService = module.get(ActivateClient);
    createClientService = module.get(CreateClient);
    deactivateClientService = module.get(DeactivateClient);
    findAllClientService = module.get(FindAllClient);
    findClientByIdService = module.get(FindClientById);
    findSubClientsService = module.get(FindSubClients);
    editClientService = module.get(EditClient);
    getClientSequenceService = module.get(GetClientSequence);
    linkClientAttendanceAndMaintenanceService = module.get(LinkClientAttendanceAndMaintenance);
    setClientNextIdService = module.get(SetClientNextId);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClient.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientInputDto>();
      const output = createMock<CreateClientOutputDto>();
      const createSpy = jest.spyOn(createClientService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('getSequence', () => {
    it('should call getClientSequence.execute and return its result', async() => {
      const output = createMock<GetClientSequenceOutputDto>();
      const executeSpy = jest.spyOn(getClientSequenceService, 'execute').mockResolvedValue(output);

      const result = await sut.getSequence();

      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalledWith();
    });
  });

  describe('setSequence', () => {
    it('should call setClientNextId.execute with body', async() => {
      const body = createMock<SetClientNextIdInputDto>();
      const output = createMock<SuccessMessage>();
      const executeSpy = jest.spyOn(setClientNextIdService, 'execute').mockResolvedValue(output);

      const result = await sut.setSequence(body);

      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClient.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientQueryDto>();
      const output = createMock<IPagination<ClientDto>>();
      const findAllSpy = jest.spyOn(findAllClientService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientDto>();
      const findOneSpy = jest.spyOn(findClientByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('findSubClients', () => {
    it('should call findSubClients.execute with params.id and queries', async() => {
      // Arrange
      const params = createMock<Params>();
      const queries = createMock<FindSubClientsQueryDto>();
      const output = createMock<IPagination<ClientDto>>();
      const findSubClientsSpy = jest.spyOn(findSubClientsService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findSubClientsByClientId(params, queries);

      // Assert
      expect(result).toEqual(output);
      expect(findSubClientsSpy).toHaveBeenCalledWith(params.id, queries);
    });
  });

  describe('activate', () => {
    it('should call activateClient.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateClientService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.activate(params);

      // Assert
      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateClient.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateClientService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.deactivate(params);

      // Assert
      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('linkAttendanceMaintenance', () => {
    it('should call linkClientAttendanceAndMaintenance.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<LinkClientAttendanceAndMaintenanceInputDto>();
      const output = createMock<SuccessMessage>();
      const executeSpy = jest.spyOn(linkClientAttendanceAndMaintenanceService, 'execute').mockResolvedValue(output);

      const result = await sut.linkAttendanceMaintenance(params, body);

      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('update', () => {
    it('should call editClient.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });
});
