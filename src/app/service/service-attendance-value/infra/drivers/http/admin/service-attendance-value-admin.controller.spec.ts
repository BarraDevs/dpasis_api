import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceAttendanceValueDto } from 'src/app/service/service-attendance-value/application/dtos/service-attendance-value.dto';
import { CreateServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/create-service-attendance-value/create-service-attendance-value.service';
import {
  CreateServiceAttendanceValueInputDto,
  CreateServiceAttendanceValueOutputDto,
} from 'src/app/service/service-attendance-value/application/usecases/create-service-attendance-value/dtos/create-service-attendance-value.dto';
import { DeleteServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/delete-service-attendance-value/delete-service-attendance-value.service';
import { EditServiceAttendanceValueInputDto } from 'src/app/service/service-attendance-value/application/usecases/edit-service-attendance-value/dtos/edit-service-attendance-value.dto';
import { EditServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/edit-service-attendance-value/edit-service-attendance-value.service';
import { FindAllServiceAttendanceValueQueryDto } from 'src/app/service/service-attendance-value/application/usecases/find-all-service-attendance-value/dtos/find-all-service-attendance-value.dto';
import { FindAllServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/find-all-service-attendance-value/find-all-service-attendance-value.service';
import { FindServiceAttendanceValueById } from 'src/app/service/service-attendance-value/application/usecases/find-service-attendance-value-by-id/find-service-attendance-value-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceAttendanceValueAdminController } from './service-attendance-value-admin.controller';

describe('ServiceAttendanceValueAdminController - Unit tests', () => {
  let sut: ServiceAttendanceValueAdminController;
  let createService: CreateServiceAttendanceValue;
  let findAllService: FindAllServiceAttendanceValue;
  let findByIdService: FindServiceAttendanceValueById;
  let editService: EditServiceAttendanceValue;
  let deleteService: DeleteServiceAttendanceValue;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceAttendanceValueAdminController],
      providers: [
        { provide: CreateServiceAttendanceValue, useValue: createMock<CreateServiceAttendanceValue>() },
        { provide: FindAllServiceAttendanceValue, useValue: createMock<FindAllServiceAttendanceValue>() },
        { provide: FindServiceAttendanceValueById, useValue: createMock<FindServiceAttendanceValueById>() },
        { provide: EditServiceAttendanceValue, useValue: createMock<EditServiceAttendanceValue>() },
        { provide: DeleteServiceAttendanceValue, useValue: createMock<DeleteServiceAttendanceValue>() },
      ],
    }).compile();

    sut = module.get(ServiceAttendanceValueAdminController);
    createService = module.get(CreateServiceAttendanceValue);
    findAllService = module.get(FindAllServiceAttendanceValue);
    findByIdService = module.get(FindServiceAttendanceValueById);
    editService = module.get(EditServiceAttendanceValue);
    deleteService = module.get(DeleteServiceAttendanceValue);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceAttendanceValue.execute with body', async() => {
      const body = createMock<CreateServiceAttendanceValueInputDto>();
      const output = createMock<CreateServiceAttendanceValueOutputDto>();
      const spy = jest.spyOn(createService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceAttendanceValue.execute with queries', async() => {
      const queries = createMock<FindAllServiceAttendanceValueQueryDto>();
      const output = createMock<IPagination<ServiceAttendanceValueDto>>();
      const spy = jest.spyOn(findAllService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceAttendanceValueById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceAttendanceValueDto>();
      const spy = jest.spyOn(findByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceAttendanceValue.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceAttendanceValueInputDto>();
      const output = createMock<SuccessMessage>();
      const spy = jest.spyOn(editService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceAttendanceValue.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const spy = jest.spyOn(deleteService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id);
    });
  });
});
