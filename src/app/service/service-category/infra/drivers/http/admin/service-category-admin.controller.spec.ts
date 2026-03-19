import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceCategoryDto } from 'src/app/service/service-category/application/dtos/service-category.dto';
import { CreateServiceCategory } from 'src/app/service/service-category/application/usecases/create-service-category/create-service-category.service';
import { CreateServiceCategoryInputDto, CreateServiceCategoryOutputDto } from 'src/app/service/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { DeleteServiceCategory } from 'src/app/service/service-category/application/usecases/delete-service-category/delete-service-category.service';
import { EditServiceCategoryInputDto } from 'src/app/service/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { EditServiceCategory } from 'src/app/service/service-category/application/usecases/edit-service-category/edit-service-category.service';
import { FindAllServiceCategoryQueryDto } from 'src/app/service/service-category/application/usecases/find-all-service-category/dtos/find-all-service-category.dto';
import { FindAllServiceCategory } from 'src/app/service/service-category/application/usecases/find-all-service-category/find-all-service-category.service';
import { FindServiceCategoryById } from 'src/app/service/service-category/application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { UpdateServiceCategoryStatus } from 'src/app/service/service-category/application/usecases/update-service-category-status/update-service-category-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceCategoryAdminController } from './service-category-admin.controller';

describe('ServiceCategoryAdminController - Unit tests', () => {
  let sut: ServiceCategoryAdminController;
  let createServiceCategoryService: CreateServiceCategory;
  let findAllServiceCategoryService: FindAllServiceCategory;
  let findServiceCategoryByIdService: FindServiceCategoryById;
  let editServiceCategoryService: EditServiceCategory;
  let updateServiceCategoryStatusService: UpdateServiceCategoryStatus;
  let deleteServiceCategoryService: DeleteServiceCategory;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceCategoryAdminController],
      providers: [
        { provide: CreateServiceCategory, useValue: createMock<CreateServiceCategory>() },
        { provide: FindAllServiceCategory, useValue: createMock<FindAllServiceCategory>() },
        { provide: FindServiceCategoryById, useValue: createMock<FindServiceCategoryById>() },
        { provide: EditServiceCategory, useValue: createMock<EditServiceCategory>() },
        { provide: UpdateServiceCategoryStatus, useValue: createMock<UpdateServiceCategoryStatus>() },
        { provide: DeleteServiceCategory, useValue: createMock<DeleteServiceCategory>() },
      ],
    }).compile();

    sut = module.get(ServiceCategoryAdminController);
    createServiceCategoryService = module.get(CreateServiceCategory);
    findAllServiceCategoryService = module.get(FindAllServiceCategory);
    findServiceCategoryByIdService = module.get(FindServiceCategoryById);
    editServiceCategoryService = module.get(EditServiceCategory);
    updateServiceCategoryStatusService = module.get(UpdateServiceCategoryStatus);
    deleteServiceCategoryService = module.get(DeleteServiceCategory);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceCategory.execute with body', async() => {
      const body = createMock<CreateServiceCategoryInputDto>();
      const output = createMock<CreateServiceCategoryOutputDto>();
      const createSpy = jest.spyOn(createServiceCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceCategory.execute with queries', async() => {
      const queries = createMock<FindAllServiceCategoryQueryDto>();
      const output = createMock<IPagination<ServiceCategoryDto>>();
      const findAllSpy = jest.spyOn(findAllServiceCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceCategoryById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceCategoryDto>();
      const findOneSpy = jest.spyOn(findServiceCategoryByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateServiceCategoryStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateServiceCategoryStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceCategory.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceCategoryInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editServiceCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceCategory.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteServiceCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
