import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { CreateClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/create-client-invoice-config/create-client-invoice-config.service';
import { CreateClientInvoiceConfigInputDto, CreateClientInvoiceConfigOutputDto } from 'src/app/client/client-invoice-config/application/usecases/create-client-invoice-config/dtos/create-client-invoice-config.dto';
import { DeleteClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/delete-client-invoice-config/delete-client-invoice-config.service';
import { EditClientInvoiceConfigInputDto } from 'src/app/client/client-invoice-config/application/usecases/edit-client-invoice-config/dtos/edit-client-invoice-config.dto';
import { EditClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/edit-client-invoice-config/edit-client-invoice-config.service';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params, ParamsClientId } from 'src/infra/validators/class/dtos/params';
import { ClientInvoiceConfigAdminController } from './client-invoice-config-admin.controller';

describe('ClientInvoiceConfigAdminController - Unit tests', () => {
  let sut: ClientInvoiceConfigAdminController;
  let createClientInvoiceConfig: CreateClientInvoiceConfig;
  let editClientInvoiceConfig: EditClientInvoiceConfig;
  let findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId;
  let deleteClientInvoiceConfig: DeleteClientInvoiceConfig;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientInvoiceConfigAdminController],
      providers: [
        { provide: CreateClientInvoiceConfig, useValue: createMock<CreateClientInvoiceConfig>() },
        { provide: EditClientInvoiceConfig, useValue: createMock<EditClientInvoiceConfig>() },
        { provide: FindClientInvoiceConfigByClientId, useValue: createMock<FindClientInvoiceConfigByClientId>() },
        { provide: DeleteClientInvoiceConfig, useValue: createMock<DeleteClientInvoiceConfig>() },
      ],
    }).compile();

    sut = module.get(ClientInvoiceConfigAdminController);
    createClientInvoiceConfig = module.get(CreateClientInvoiceConfig);
    editClientInvoiceConfig = module.get(EditClientInvoiceConfig);
    findClientInvoiceConfigByClientId = module.get(FindClientInvoiceConfigByClientId);
    deleteClientInvoiceConfig = module.get(DeleteClientInvoiceConfig);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientInvoiceConfig.execute with body', async() => {
      // Arrange
      const body = createMock<CreateClientInvoiceConfigInputDto>();
      const output = createMock<CreateClientInvoiceConfigOutputDto>();
      const createSpy = jest.spyOn(createClientInvoiceConfig, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findByClientId', () => {
    it('should call findClientInvoiceConfigByClientId.execute with params.clientId', async() => {
      // Arrange
      const params = createMock<ParamsClientId>();
      const output = createMock<ClientInvoiceConfigDto>();
      const findSpy = jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findByClientId(params);

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith(params.clientId);
    });
  });

  describe('update', () => {
    it('should call editClientInvoiceConfig.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditClientInvoiceConfigInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientInvoiceConfig, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientInvoiceConfig.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientInvoiceConfig, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
