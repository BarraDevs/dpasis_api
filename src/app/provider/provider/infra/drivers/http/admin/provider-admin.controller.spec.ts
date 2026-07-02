import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ProviderDto } from 'src/app/provider/provider/application/dtos/provider.dto';
import { ActivateProvider } from 'src/app/provider/provider/application/usecases/activate-provider/activate-provider.service';
import { CreateProvider } from 'src/app/provider/provider/application/usecases/create-provider/create-provider.service';
import { CreateProviderInputDto, CreateProviderOutputDto } from 'src/app/provider/provider/application/usecases/create-provider/dtos/create-provider.dto';
import { DeactivateProvider } from 'src/app/provider/provider/application/usecases/deactivate-provider/deactivate-provider.service';
import { DeleteProvider } from 'src/app/provider/provider/application/usecases/delete-provider/delete-provider.service';
import { EditProviderInputDto } from 'src/app/provider/provider/application/usecases/edit-provider/dtos/edit-provider.dto';
import { EditProvider } from 'src/app/provider/provider/application/usecases/edit-provider/edit-provider.service';
import { FindAllProviderQueryDto } from 'src/app/provider/provider/application/usecases/find-all-provider/dtos/find-all-provider.dto';
import { FindAllProvider } from 'src/app/provider/provider/application/usecases/find-all-provider/find-all-provider.service';
import { FindProviderById } from 'src/app/provider/provider/application/usecases/find-provider-by-id/find-provider-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProviderAdminController } from './provider-admin.controller';

describe('ProviderAdminController - Unit tests', () => {
  let sut: ProviderAdminController;
  let activateProviderService: ActivateProvider;
  let createProviderService: CreateProvider;
  let deactivateProviderService: DeactivateProvider;
  let deleteProviderService: DeleteProvider;
  let findAllProviderService: FindAllProvider;
  let findProviderByIdService: FindProviderById;
  let editProviderService: EditProvider;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ProviderAdminController],
      providers: [
        { provide: ActivateProvider, useValue: createMock<ActivateProvider>() },
        { provide: CreateProvider, useValue: createMock<CreateProvider>() },
        { provide: DeactivateProvider, useValue: createMock<DeactivateProvider>() },
        { provide: DeleteProvider, useValue: createMock<DeleteProvider>() },
        { provide: FindAllProvider, useValue: createMock<FindAllProvider>() },
        { provide: FindProviderById, useValue: createMock<FindProviderById>() },
        { provide: EditProvider, useValue: createMock<EditProvider>() },
      ],
    }).compile();

    sut = module.get(ProviderAdminController);
    activateProviderService = module.get(ActivateProvider);
    createProviderService = module.get(CreateProvider);
    deactivateProviderService = module.get(DeactivateProvider);
    deleteProviderService = module.get(DeleteProvider);
    findAllProviderService = module.get(FindAllProvider);
    findProviderByIdService = module.get(FindProviderById);
    editProviderService = module.get(EditProvider);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createProvider.execute with body', async() => {
      const body = createMock<CreateProviderInputDto>();
      const output = createMock<CreateProviderOutputDto>();
      const createSpy = jest.spyOn(createProviderService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllProvider.execute with queries', async() => {
      const queries = createMock<FindAllProviderQueryDto>();
      const output = createMock<IPagination<ProviderDto>>();
      const findAllSpy = jest.spyOn(findAllProviderService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findProviderById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ProviderDto>();
      const findOneSpy = jest.spyOn(findProviderByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateProvider.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateProviderService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateProvider.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateProviderService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editProvider.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditProviderInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editProviderService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteProvider.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deleteSpy = jest.spyOn(deleteProviderService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(deleteSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
