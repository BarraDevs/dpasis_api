import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceBilledDto } from 'src/app/service/service-billed/application/dtos/service-billed.dto';
import { ActivateServiceBilled } from 'src/app/service/service-billed/application/usecases/activate-service-billed/activate-service-billed.service';
import { CreateServiceBilled } from 'src/app/service/service-billed/application/usecases/create-service-billed/create-service-billed.service';
import { CreateServiceBilledInputDto, CreateServiceBilledOutputDto } from 'src/app/service/service-billed/application/usecases/create-service-billed/dtos/create-service-billed.dto';
import { DeactivateServiceBilled } from 'src/app/service/service-billed/application/usecases/deactivate-service-billed/deactivate-service-billed.service';
import { DeleteServiceBilled } from 'src/app/service/service-billed/application/usecases/delete-service-billed/delete-service-billed.service';
import { EditServiceBilledInputDto } from 'src/app/service/service-billed/application/usecases/edit-service-billed/dtos/edit-service-billed.dto';
import { EditServiceBilled } from 'src/app/service/service-billed/application/usecases/edit-service-billed/edit-service-billed.service';
import { FindAllServiceBilledQueryDto } from 'src/app/service/service-billed/application/usecases/find-all-service-billed/dtos/find-all-service-billed.dto';
import { FindAllServiceBilled } from 'src/app/service/service-billed/application/usecases/find-all-service-billed/find-all-service-billed.service';
import { FindServiceBilledById } from 'src/app/service/service-billed/application/usecases/find-service-billed-by-id/find-service-billed-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceBilledAdminController } from './service-billed-admin.controller';

describe('ServiceBilledAdminController - Unit tests', () => {
  let sut: ServiceBilledAdminController;
  let activateServiceBilled: ActivateServiceBilled;
  let createServiceBilled: CreateServiceBilled;
  let deactivateServiceBilled: DeactivateServiceBilled;
  let findAllServiceBilled: FindAllServiceBilled;
  let findServiceBilledById: FindServiceBilledById;
  let editServiceBilled: EditServiceBilled;
  let deleteServiceBilled: DeleteServiceBilled;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceBilledAdminController],
      providers: [
        { provide: ActivateServiceBilled, useValue: createMock<ActivateServiceBilled>() },
        { provide: CreateServiceBilled, useValue: createMock<CreateServiceBilled>() },
        { provide: DeactivateServiceBilled, useValue: createMock<DeactivateServiceBilled>() },
        { provide: FindAllServiceBilled, useValue: createMock<FindAllServiceBilled>() },
        { provide: FindServiceBilledById, useValue: createMock<FindServiceBilledById>() },
        { provide: EditServiceBilled, useValue: createMock<EditServiceBilled>() },
        { provide: DeleteServiceBilled, useValue: createMock<DeleteServiceBilled>() },
      ],
    }).compile();

    sut = module.get(ServiceBilledAdminController);
    activateServiceBilled = module.get(ActivateServiceBilled);
    createServiceBilled = module.get(CreateServiceBilled);
    deactivateServiceBilled = module.get(DeactivateServiceBilled);
    findAllServiceBilled = module.get(FindAllServiceBilled);
    findServiceBilledById = module.get(FindServiceBilledById);
    editServiceBilled = module.get(EditServiceBilled);
    deleteServiceBilled = module.get(DeleteServiceBilled);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceBilled.execute with body', async() => {
      const body = createMock<CreateServiceBilledInputDto>();
      const output = createMock<CreateServiceBilledOutputDto>();
      const createSpy = jest.spyOn(createServiceBilled, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceBilled.execute with queries', async() => {
      const queries = createMock<FindAllServiceBilledQueryDto>();
      const output = createMock<IPagination<ServiceBilledDto>>();
      const findAllSpy = jest.spyOn(findAllServiceBilled, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceBilledById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceBilledDto>();
      const findOneSpy = jest.spyOn(findServiceBilledById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateServiceBilled.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateServiceBilled, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateServiceBilled.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateServiceBilled, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceBilled.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceBilledInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editServiceBilled, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceBilled.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteServiceBilled, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
