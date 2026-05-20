import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { DepartmentDto } from 'src/app/global/department/application/dtos/department.dto';
import { CreateDepartment } from 'src/app/global/department/application/usecases/create-department/create-department.service';
import { CreateDepartmentInputDto, CreateDepartmentOutputDto } from 'src/app/global/department/application/usecases/create-department/dtos/create-department.dto';
import { DeleteDepartment } from 'src/app/global/department/application/usecases/delete-department/delete-department.service';
import { EditDepartmentInputDto } from 'src/app/global/department/application/usecases/edit-department/dtos/edit-department.dto';
import { EditDepartment } from 'src/app/global/department/application/usecases/edit-department/edit-department.service';
import { FindAllDepartmentQueryDto } from 'src/app/global/department/application/usecases/find-all-department/dtos/find-all-department.dto';
import { FindAllDepartment } from 'src/app/global/department/application/usecases/find-all-department/find-all-department.service';
import { FindDepartmentById } from 'src/app/global/department/application/usecases/find-department-by-id/find-department-by-id.service';
import { UpdateDepartmentStatus } from 'src/app/global/department/application/usecases/update-department-status/update-department-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { DepartmentAdminController } from './department-admin.controller';

describe('DepartmentAdminController - Unit tests', () => {
  let sut: DepartmentAdminController;
  let createDepartmentService: CreateDepartment;
  let findAllDepartmentService: FindAllDepartment;
  let findDepartmentByIdService: FindDepartmentById;
  let editDepartmentService: EditDepartment;
  let updateDepartmentStatusService: UpdateDepartmentStatus;
  let deleteDepartmentService: DeleteDepartment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [DepartmentAdminController],
      providers: [
        { provide: CreateDepartment, useValue: createMock<CreateDepartment>() },
        { provide: FindAllDepartment, useValue: createMock<FindAllDepartment>() },
        { provide: FindDepartmentById, useValue: createMock<FindDepartmentById>() },
        { provide: EditDepartment, useValue: createMock<EditDepartment>() },
        { provide: UpdateDepartmentStatus, useValue: createMock<UpdateDepartmentStatus>() },
        { provide: DeleteDepartment, useValue: createMock<DeleteDepartment>() },
      ],
    }).compile();

    sut = module.get(DepartmentAdminController);
    createDepartmentService = module.get(CreateDepartment);
    findAllDepartmentService = module.get(FindAllDepartment);
    findDepartmentByIdService = module.get(FindDepartmentById);
    editDepartmentService = module.get(EditDepartment);
    updateDepartmentStatusService = module.get(UpdateDepartmentStatus);
    deleteDepartmentService = module.get(DeleteDepartment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createDepartment.execute with body', async() => {
      const body = createMock<CreateDepartmentInputDto>();
      const output = createMock<CreateDepartmentOutputDto>();
      const createSpy = jest.spyOn(createDepartmentService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllDepartment.execute with queries', async() => {
      const queries = createMock<FindAllDepartmentQueryDto>();
      const output = createMock<IPagination<DepartmentDto>>();
      const findAllSpy = jest.spyOn(findAllDepartmentService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findDepartmentById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<DepartmentDto>();
      const findOneSpy = jest.spyOn(findDepartmentByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateDepartmentStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateDepartmentStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editDepartment.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditDepartmentInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editDepartmentService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteDepartment.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteDepartmentService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
