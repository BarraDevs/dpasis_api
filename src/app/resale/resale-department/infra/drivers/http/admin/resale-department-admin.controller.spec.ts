import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ResaleDepartmentDto } from 'src/app/resale/resale-department/application/dtos/resale-department.dto';
import { CreateResaleDepartment } from 'src/app/resale/resale-department/application/usecases/create-resale-department/create-resale-department.service';
import { CreateResaleDepartmentInputDto, CreateResaleDepartmentOutputDto } from 'src/app/resale/resale-department/application/usecases/create-resale-department/dtos/create-resale-department.dto';
import { DeleteResaleDepartment } from 'src/app/resale/resale-department/application/usecases/delete-resale-department/delete-resale-department.service';
import { EditResaleDepartmentInputDto } from 'src/app/resale/resale-department/application/usecases/edit-resale-department/dtos/edit-resale-department.dto';
import { EditResaleDepartment } from 'src/app/resale/resale-department/application/usecases/edit-resale-department/edit-resale-department.service';
import { FindAllResaleDepartmentQueryDto } from 'src/app/resale/resale-department/application/usecases/find-all-resale-department/dtos/find-all-resale-department.dto';
import { FindAllResaleDepartment } from 'src/app/resale/resale-department/application/usecases/find-all-resale-department/find-all-resale-department.service';
import { FindResaleDepartmentById } from 'src/app/resale/resale-department/application/usecases/find-resale-department-by-id/find-resale-department-by-id.service';
import { UpdateResaleDepartmentStatus } from 'src/app/resale/resale-department/application/usecases/update-resale-department-status/update-resale-department-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ResaleDepartmentAdminController } from './resale-department-admin.controller';

describe('ResaleDepartmentAdminController - Unit tests', () => {
  let sut: ResaleDepartmentAdminController;
  let createResaleDepartmentService: CreateResaleDepartment;
  let findAllResaleDepartmentService: FindAllResaleDepartment;
  let findResaleDepartmentByIdService: FindResaleDepartmentById;
  let editResaleDepartmentService: EditResaleDepartment;
  let updateResaleDepartmentStatusService: UpdateResaleDepartmentStatus;
  let deleteResaleDepartmentService: DeleteResaleDepartment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ResaleDepartmentAdminController],
      providers: [
        { provide: CreateResaleDepartment, useValue: createMock<CreateResaleDepartment>() },
        { provide: FindAllResaleDepartment, useValue: createMock<FindAllResaleDepartment>() },
        { provide: FindResaleDepartmentById, useValue: createMock<FindResaleDepartmentById>() },
        { provide: EditResaleDepartment, useValue: createMock<EditResaleDepartment>() },
        { provide: UpdateResaleDepartmentStatus, useValue: createMock<UpdateResaleDepartmentStatus>() },
        { provide: DeleteResaleDepartment, useValue: createMock<DeleteResaleDepartment>() },
      ],
    }).compile();

    sut = module.get(ResaleDepartmentAdminController);
    createResaleDepartmentService = module.get(CreateResaleDepartment);
    findAllResaleDepartmentService = module.get(FindAllResaleDepartment);
    findResaleDepartmentByIdService = module.get(FindResaleDepartmentById);
    editResaleDepartmentService = module.get(EditResaleDepartment);
    updateResaleDepartmentStatusService = module.get(UpdateResaleDepartmentStatus);
    deleteResaleDepartmentService = module.get(DeleteResaleDepartment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createResaleDepartment.execute with body', async() => {
      // Arrange
      const body = createMock<CreateResaleDepartmentInputDto>();
      const output = createMock<CreateResaleDepartmentOutputDto>();
      const createSpy = jest.spyOn(createResaleDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllResaleDepartment.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllResaleDepartmentQueryDto>();
      const output = createMock<IPagination<ResaleDepartmentDto>>();
      const findAllSpy = jest.spyOn(findAllResaleDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findResaleDepartmentById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ResaleDepartmentDto>();
      const findOneSpy = jest.spyOn(findResaleDepartmentByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateResaleDepartmentStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateResaleDepartmentStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editResaleDepartment.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditResaleDepartmentInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editResaleDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteResaleDepartment.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteResaleDepartmentService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
