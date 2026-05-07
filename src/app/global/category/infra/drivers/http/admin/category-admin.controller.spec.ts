import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CategoryDto } from 'src/app/global/category/application/dtos/category.dto';
import { CreateCategory } from 'src/app/global/category/application/usecases/create-category/create-category.service';
import { CreateCategoryInputDto, CreateCategoryOutputDto } from 'src/app/global/category/application/usecases/create-category/dtos/create-category.dto';
import { DeleteCategory } from 'src/app/global/category/application/usecases/delete-category/delete-category.service';
import { EditCategoryInputDto } from 'src/app/global/category/application/usecases/edit-category/dtos/edit-category.dto';
import { EditCategory } from 'src/app/global/category/application/usecases/edit-category/edit-category.service';
import { FindAllCategoryQueryDto } from 'src/app/global/category/application/usecases/find-all-category/dtos/find-all-category.dto';
import { FindAllCategory } from 'src/app/global/category/application/usecases/find-all-category/find-all-category.service';
import { FindCategoryById } from 'src/app/global/category/application/usecases/find-category-by-id/find-category-by-id.service';
import { UpdateCategoryStatus } from 'src/app/global/category/application/usecases/update-category-status/update-category-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CategoryAdminController } from './category-admin.controller';

describe('CategoryAdminController - Unit tests', () => {
  let sut: CategoryAdminController;
  let createCategoryService: CreateCategory;
  let findAllCategoryService: FindAllCategory;
  let findCategoryByIdService: FindCategoryById;
  let editCategoryService: EditCategory;
  let updateCategoryStatusService: UpdateCategoryStatus;
  let deleteCategoryService: DeleteCategory;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [CategoryAdminController],
      providers: [
        { provide: CreateCategory, useValue: createMock<CreateCategory>() },
        { provide: FindAllCategory, useValue: createMock<FindAllCategory>() },
        { provide: FindCategoryById, useValue: createMock<FindCategoryById>() },
        { provide: EditCategory, useValue: createMock<EditCategory>() },
        { provide: UpdateCategoryStatus, useValue: createMock<UpdateCategoryStatus>() },
        { provide: DeleteCategory, useValue: createMock<DeleteCategory>() },
      ],
    }).compile();

    sut = module.get(CategoryAdminController);
    createCategoryService = module.get(CreateCategory);
    findAllCategoryService = module.get(FindAllCategory);
    findCategoryByIdService = module.get(FindCategoryById);
    editCategoryService = module.get(EditCategory);
    updateCategoryStatusService = module.get(UpdateCategoryStatus);
    deleteCategoryService = module.get(DeleteCategory);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createCategory.execute with body', async() => {
      const body = createMock<CreateCategoryInputDto>();
      const output = createMock<CreateCategoryOutputDto>();
      const createSpy = jest.spyOn(createCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllCategory.execute with queries', async() => {
      const queries = createMock<FindAllCategoryQueryDto>();
      const output = createMock<IPagination<CategoryDto>>();
      const findAllSpy = jest.spyOn(findAllCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findCategoryById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<CategoryDto>();
      const findOneSpy = jest.spyOn(findCategoryByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateCategoryStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateCategoryStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editCategory.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditCategoryInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteCategory.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteCategoryService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
