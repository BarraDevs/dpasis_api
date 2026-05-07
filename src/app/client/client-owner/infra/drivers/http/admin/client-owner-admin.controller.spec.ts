import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientOwnerDto } from 'src/app/client/client-owner/application/dtos/client-owner.dto';
import { CreateClientOwner } from 'src/app/client/client-owner/application/usecases/create-client-owner/create-client-owner.service';
import { CreateClientOwnerInputDto, CreateClientOwnerOutputDto } from 'src/app/client/client-owner/application/usecases/create-client-owner/dtos/create-client-owner.dto';
import { DeleteClientOwner } from 'src/app/client/client-owner/application/usecases/delete-client-owner/delete-client-owner.service';
import { EditClientOwnerInputDto } from 'src/app/client/client-owner/application/usecases/edit-client-owner/dtos/edit-client-owner.dto';
import { EditClientOwner } from 'src/app/client/client-owner/application/usecases/edit-client-owner/edit-client-owner.service';
import { FindAllClientOwnerQueryDto } from 'src/app/client/client-owner/application/usecases/find-all-client-owner/dtos/find-all-client-owner.dto';
import { FindAllClientOwner } from 'src/app/client/client-owner/application/usecases/find-all-client-owner/find-all-client-owner.service';
import { FindClientOwnerById } from 'src/app/client/client-owner/application/usecases/find-client-owner-by-id/find-client-owner-by-id.service';
import { UpdateClientOwnerStatus } from 'src/app/client/client-owner/application/usecases/update-client-owner-status/update-client-owner-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientOwnerAdminController } from './client-owner-admin.controller';

describe('ClientOwnerAdminController - Unit tests', () => {
  let sut: ClientOwnerAdminController;
  let createClientOwnerService: CreateClientOwner;
  let findAllClientOwnerService: FindAllClientOwner;
  let findClientOwnerByIdService: FindClientOwnerById;
  let editClientOwnerService: EditClientOwner;
  let updateClientOwnerStatusService: UpdateClientOwnerStatus;
  let deleteClientOwnerService: DeleteClientOwner;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientOwnerAdminController],
      providers: [
        { provide: CreateClientOwner, useValue: createMock<CreateClientOwner>() },
        { provide: FindAllClientOwner, useValue: createMock<FindAllClientOwner>() },
        { provide: FindClientOwnerById, useValue: createMock<FindClientOwnerById>() },
        { provide: EditClientOwner, useValue: createMock<EditClientOwner>() },
        { provide: UpdateClientOwnerStatus, useValue: createMock<UpdateClientOwnerStatus>() },
        { provide: DeleteClientOwner, useValue: createMock<DeleteClientOwner>() },
      ],
    }).compile();

    sut = module.get(ClientOwnerAdminController);
    createClientOwnerService = module.get(CreateClientOwner);
    findAllClientOwnerService = module.get(FindAllClientOwner);
    findClientOwnerByIdService = module.get(FindClientOwnerById);
    editClientOwnerService = module.get(EditClientOwner);
    updateClientOwnerStatusService = module.get(UpdateClientOwnerStatus);
    deleteClientOwnerService = module.get(DeleteClientOwner);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientOwner.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientOwnerInputDto>();
      const output = createMock<CreateClientOwnerOutputDto>();
      const createSpy = jest.spyOn(createClientOwnerService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientOwner.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientOwnerQueryDto>();
      const output = createMock<IPagination<ClientOwnerDto>>();
      const findAllSpy = jest.spyOn(findAllClientOwnerService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientOwnerById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientOwnerDto>();
      const findOneSpy = jest.spyOn(findClientOwnerByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientOwnerStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientOwnerStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientOwner.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientOwnerInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientOwnerService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientOwner.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientOwnerService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
