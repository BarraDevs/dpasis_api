import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { ActivateClient } from 'src/app/client/application/usecases/activate-client/activate-client.service';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from 'src/app/client/application/usecases/create-client/dtos/create-client.dto';
import { DeactivateClient } from 'src/app/client/application/usecases/deactivate-client/deactivate-client.service';
import { DeleteClient } from 'src/app/client/application/usecases/delete-client/delete-client.service';
import { EditClientInputDto } from 'src/app/client/application/usecases/edit-client/dtos/edit-client.dto';
import { EditClient } from 'src/app/client/application/usecases/edit-client/edit-client.service';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindAllClient } from 'src/app/client/application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from 'src/app/client/application/usecases/find-client-by-id/find-client-by-id.service';
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
  let editClientService: EditClient;
  let deleteClientService: DeleteClient;

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
        { provide: EditClient, useValue: createMock<EditClient>() },
        { provide: DeleteClient, useValue: createMock<DeleteClient>() },
      ],
    }).compile();

    sut = module.get(ClientAdminController);
    activateClientService = module.get(ActivateClient);
    createClientService = module.get(CreateClient);
    deactivateClientService = module.get(DeactivateClient);
    findAllClientService = module.get(FindAllClient);
    findClientByIdService = module.get(FindClientById);
    editClientService = module.get(EditClient);
    deleteClientService = module.get(DeleteClient);
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

  describe('remove', () => {
    it('should call deleteClient.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
