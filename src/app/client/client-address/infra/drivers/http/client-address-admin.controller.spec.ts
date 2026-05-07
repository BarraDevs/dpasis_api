import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAddressDto } from 'src/app/client/client-address/application/dtos/client-address.dto';
import { CreateClientAddress } from 'src/app/client/client-address/application/usecases/create-client-address/create-client-address.service';
import { CreateClientAddressInputDto, CreateClientAddressOutputDto } from 'src/app/client/client-address/application/usecases/create-client-address/dtos/create-client-address.dto';
import { DeleteClientAddress } from 'src/app/client/client-address/application/usecases/delete-client-address/delete-client-address.service';
import { EditClientAddressInputDto } from 'src/app/client/client-address/application/usecases/edit-client-address/dtos/edit-client-address.dto';
import { EditClientAddress } from 'src/app/client/client-address/application/usecases/edit-client-address/edit-client-address.service';
import { FindAllClientAddressQueryDto } from 'src/app/client/client-address/application/usecases/find-all-client-address/dtos/find-all-client-address.dto';
import { FindAllClientAddress } from 'src/app/client/client-address/application/usecases/find-all-client-address/find-all-client-address.service';
import { ActivateClientAddress } from 'src/app/client/client-address/application/usecases/activate-client-address/activate-client-address.service';
import { DeactivateClientAddress } from 'src/app/client/client-address/application/usecases/deactivate-client-address/deactivate-client-address.service';
import { FindClientAddressById } from 'src/app/client/client-address/application/usecases/find-client-address-by-id/find-client-address-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAddressAdminController } from './client-address-admin.controller';

describe('ClientAddressAdminController - Unit tests', () => {
  let sut: ClientAddressAdminController;
  let createClientAddressService: CreateClientAddress;
  let findAllClientAddressService: FindAllClientAddress;
  let findClientAddressByIdService: FindClientAddressById;
  let editClientAddressService: EditClientAddress;
  let activateClientAddressService: ActivateClientAddress;
  let deactivateClientAddressService: DeactivateClientAddress;
  let deleteClientAddressService: DeleteClientAddress;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientAddressAdminController],
      providers: [
        { provide: CreateClientAddress, useValue: createMock<CreateClientAddress>() },
        { provide: FindAllClientAddress, useValue: createMock<FindAllClientAddress>() },
        { provide: FindClientAddressById, useValue: createMock<FindClientAddressById>() },
        { provide: EditClientAddress, useValue: createMock<EditClientAddress>() },
        { provide: ActivateClientAddress, useValue: createMock<ActivateClientAddress>() },
        { provide: DeactivateClientAddress, useValue: createMock<DeactivateClientAddress>() },
        { provide: DeleteClientAddress, useValue: createMock<DeleteClientAddress>() },
      ],
    }).compile();

    sut = module.get(ClientAddressAdminController);
    createClientAddressService = module.get(CreateClientAddress);
    findAllClientAddressService = module.get(FindAllClientAddress);
    findClientAddressByIdService = module.get(FindClientAddressById);
    editClientAddressService = module.get(EditClientAddress);
    activateClientAddressService = module.get(ActivateClientAddress);
    deactivateClientAddressService = module.get(DeactivateClientAddress);
    deleteClientAddressService = module.get(DeleteClientAddress);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientAddress.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientAddressInputDto>();
      const output = createMock<CreateClientAddressOutputDto>();
      const createSpy = jest.spyOn(createClientAddressService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientAddress.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllClientAddressQueryDto>();
      const output = createMock<IPagination<ClientAddressDto>>();
      const findAllSpy = jest.spyOn(findAllClientAddressService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientAddressById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ClientAddressDto>();
      const findOneSpy = jest.spyOn(findClientAddressByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateClientAddress.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateClientAddressService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateClientAddress.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateClientAddressService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientAddress.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientAddressInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientAddressService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientAddress.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientAddressService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
