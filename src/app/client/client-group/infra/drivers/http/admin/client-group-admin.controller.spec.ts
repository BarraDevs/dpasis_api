import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientGroupDto } from 'src/app/client/client-group/application/dtos/client-group.dto';
import { CreateClientGroup } from 'src/app/client/client-group/application/usecases/create-client-group/create-client-group.service';
import { CreateClientGroupInputDto, CreateClientGroupOutputDto } from 'src/app/client/client-group/application/usecases/create-client-group/dtos/create-client-group.dto';
import { DeleteClientGroup } from 'src/app/client/client-group/application/usecases/delete-client-group/delete-client-group.service';
import { EditClientGroupInputDto } from 'src/app/client/client-group/application/usecases/edit-client-group/dtos/edit-client-group.dto';
import { EditClientGroup } from 'src/app/client/client-group/application/usecases/edit-client-group/edit-client-group.service';
import { FindAllClientGroupQueryDto } from 'src/app/client/client-group/application/usecases/find-all-client-group/dtos/find-all-client-group.dto';
import { FindAllClientGroup } from 'src/app/client/client-group/application/usecases/find-all-client-group/find-all-client-group.service';
import { FindClientGroupById } from 'src/app/client/client-group/application/usecases/find-client-group-by-id/find-client-group-by-id.service';
import { UpdateClientGroupStatus } from 'src/app/client/client-group/application/usecases/update-client-group-status/update-client-group-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientGroupAdminController } from './client-group-admin.controller';

describe('ClientGroupAdminController - Unit tests', () => {
  let sut: ClientGroupAdminController;
  let createClientGroupService: CreateClientGroup;
  let findAllClientGroupService: FindAllClientGroup;
  let findClientGroupByIdService: FindClientGroupById;
  let editClientGroupService: EditClientGroup;
  let updateClientGroupStatusService: UpdateClientGroupStatus;
  let deleteClientGroupService: DeleteClientGroup;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientGroupAdminController],
      providers: [
        { provide: CreateClientGroup, useValue: createMock<CreateClientGroup>() },
        { provide: FindAllClientGroup, useValue: createMock<FindAllClientGroup>() },
        { provide: FindClientGroupById, useValue: createMock<FindClientGroupById>() },
        { provide: EditClientGroup, useValue: createMock<EditClientGroup>() },
        { provide: UpdateClientGroupStatus, useValue: createMock<UpdateClientGroupStatus>() },
        { provide: DeleteClientGroup, useValue: createMock<DeleteClientGroup>() },
      ],
    }).compile();

    sut = module.get(ClientGroupAdminController);
    createClientGroupService = module.get(CreateClientGroup);
    findAllClientGroupService = module.get(FindAllClientGroup);
    findClientGroupByIdService = module.get(FindClientGroupById);
    editClientGroupService = module.get(EditClientGroup);
    updateClientGroupStatusService = module.get(UpdateClientGroupStatus);
    deleteClientGroupService = module.get(DeleteClientGroup);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientGroup.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientGroupInputDto>();
      const output = createMock<CreateClientGroupOutputDto>();
      const createSpy = jest.spyOn(createClientGroupService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientGroup.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientGroupQueryDto>();
      const output = createMock<IPagination<ClientGroupDto>>();
      const findAllSpy = jest.spyOn(findAllClientGroupService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientGroupById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientGroupDto>();
      const findOneSpy = jest.spyOn(findClientGroupByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientGroupStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientGroupStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientGroup.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientGroupInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientGroupService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientGroup.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientGroupService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
