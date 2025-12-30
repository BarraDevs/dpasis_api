import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthorizationGuard } from 'src/app/authentication/application/guards/authorization/authorization.guard';
import { ServiceCategoryDto } from 'src/app/service-category/application/dtos/service-category.dto';
import { CreateServiceCategoryInputDto, CreateServiceCategoryOutputDto } from 'src/app/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { EditServiceCategoryInputDto } from 'src/app/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { FindAllServiceCategoryQueryDto } from 'src/app/service-category/application/usecases/find-all-service-category/dtos/find-all-service-category.dto';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceCategoryController } from './service-category.controller';

describe('ServiceCategoryController', () => {
  let sut: ServiceCategoryController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCategoryModule],
    })
      // Mock the guard to always allow access for controller tests
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    sut = module.get(ServiceCategoryController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceCategoryService.execute with correct values', async() => {
      // Arrange
      const input = createMock<CreateServiceCategoryInputDto>();
      const output = createMock<CreateServiceCategoryOutputDto>();
      const createServiceCategoryServiceSpy = jest.spyOn(sut['createServiceCategoryService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createServiceCategoryServiceSpy).toHaveBeenCalledWith(input);
      expect(result).toBe(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceCategoryService.execute with correct values', async() => {
      // Arrange
      const queries = createMock<FindAllServiceCategoryQueryDto>();
      const output = createMock<IPagination<ServiceCategoryDto>>();
      const findAllServiceCategoryServiceSpy = jest.spyOn(sut['findAllServiceCategoryService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllServiceCategoryServiceSpy).toHaveBeenCalledWith(queries);
      expect(result).toBe(output);
    });
  });

  describe('findOne', () => {
    it('should call findServiceCategoryByIdService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-category-id' });
      const output = createMock<ServiceCategoryDto>();
      const findServiceCategoryByIdServiceSpy = jest.spyOn(sut['findServiceCategoryByIdService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findServiceCategoryByIdServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });

  describe('update', () => {
    it('should call editServiceCategoryService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-category-id' });
      const body = createMock<EditServiceCategoryInputDto>();
      const output = createMock<SuccessMessage>();
      const editServiceCategoryServiceSpy = jest.spyOn(sut['editServiceCategoryService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editServiceCategoryServiceSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toBe(output);
    });
  });

  describe('updateStatus', () => {
    it('should call updateServiceCategoryStatusService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-category-id' });
      const output = createMock<SuccessMessage>();
      const updateServiceCategoryStatusServiceSpy = jest.spyOn(sut['updateServiceCategoryStatusService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(updateServiceCategoryStatusServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceCategoryService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-category-id' });
      const output = createMock<SuccessMessage>();
      const deleteServiceCategoryServiceSpy = jest.spyOn(sut['deleteServiceCategoryService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(deleteServiceCategoryServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });
});
