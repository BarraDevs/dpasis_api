import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceCatalogDto } from 'src/app/service/service-catalog/application/dtos/service-catalog.dto';
import { ActivateServiceCatalog } from 'src/app/service/service-catalog/application/usecases/activate-service-catalog/activate-service-catalog.service';
import { CreateServiceCatalog } from 'src/app/service/service-catalog/application/usecases/create-service-catalog/create-service-catalog.service';
import { CreateServiceCatalogInputDto, CreateServiceCatalogOutputDto } from 'src/app/service/service-catalog/application/usecases/create-service-catalog/dtos/create-service-catalog.dto';
import { DeactivateServiceCatalog } from 'src/app/service/service-catalog/application/usecases/deactivate-service-catalog/deactivate-service-catalog.service';
import { DeleteServiceCatalog } from 'src/app/service/service-catalog/application/usecases/delete-service-catalog/delete-service-catalog.service';
import { EditServiceCatalogInputDto } from 'src/app/service/service-catalog/application/usecases/edit-service-catalog/dtos/edit-service-catalog.dto';
import { EditServiceCatalog } from 'src/app/service/service-catalog/application/usecases/edit-service-catalog/edit-service-catalog.service';
import { FindAllServiceCatalogQueryDto } from 'src/app/service/service-catalog/application/usecases/find-all-service-catalog/dtos/find-all-service-catalog.dto';
import { FindAllServiceCatalog } from 'src/app/service/service-catalog/application/usecases/find-all-service-catalog/find-all-service-catalog.service';
import { FindServiceCatalogById } from 'src/app/service/service-catalog/application/usecases/find-service-catalog-by-id/find-service-catalog-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceCatalogAdminController } from './service-catalog-admin.controller';

describe('ServiceCatalogAdminController - Unit tests', () => {
  let sut: ServiceCatalogAdminController;
  let activateServiceCatalogService: ActivateServiceCatalog;
  let createServiceCatalogService: CreateServiceCatalog;
  let deactivateServiceCatalogService: DeactivateServiceCatalog;
  let deleteServiceCatalogService: DeleteServiceCatalog;
  let findAllServiceCatalogService: FindAllServiceCatalog;
  let findServiceCatalogByIdService: FindServiceCatalogById;
  let editServiceCatalogService: EditServiceCatalog;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceCatalogAdminController],
      providers: [
        { provide: ActivateServiceCatalog, useValue: createMock<ActivateServiceCatalog>() },
        { provide: CreateServiceCatalog, useValue: createMock<CreateServiceCatalog>() },
        { provide: DeactivateServiceCatalog, useValue: createMock<DeactivateServiceCatalog>() },
        { provide: DeleteServiceCatalog, useValue: createMock<DeleteServiceCatalog>() },
        { provide: FindAllServiceCatalog, useValue: createMock<FindAllServiceCatalog>() },
        { provide: FindServiceCatalogById, useValue: createMock<FindServiceCatalogById>() },
        { provide: EditServiceCatalog, useValue: createMock<EditServiceCatalog>() },
      ],
    }).compile();

    sut = module.get(ServiceCatalogAdminController);
    activateServiceCatalogService = module.get(ActivateServiceCatalog);
    createServiceCatalogService = module.get(CreateServiceCatalog);
    deactivateServiceCatalogService = module.get(DeactivateServiceCatalog);
    deleteServiceCatalogService = module.get(DeleteServiceCatalog);
    findAllServiceCatalogService = module.get(FindAllServiceCatalog);
    findServiceCatalogByIdService = module.get(FindServiceCatalogById);
    editServiceCatalogService = module.get(EditServiceCatalog);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceCatalog.execute with body', async() => {
      const body = createMock<CreateServiceCatalogInputDto>();
      const output = createMock<CreateServiceCatalogOutputDto>();
      const createSpy = jest.spyOn(createServiceCatalogService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceCatalog.execute with queries', async() => {
      const queries = createMock<FindAllServiceCatalogQueryDto>();
      const output = createMock<IPagination<ServiceCatalogDto>>();
      const findAllSpy = jest.spyOn(findAllServiceCatalogService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceCatalogById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceCatalogDto>();
      const findOneSpy = jest.spyOn(findServiceCatalogByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateServiceCatalog.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateServiceCatalogService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateServiceCatalog.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateServiceCatalogService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceCatalog.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceCatalogInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editServiceCatalogService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceCatalog.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteServiceCatalogService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
