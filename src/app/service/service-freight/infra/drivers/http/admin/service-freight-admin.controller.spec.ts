import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceFreightDto } from 'src/app/service/service-freight/application/dtos/service-freight.dto';
import { CreateServiceFreight } from 'src/app/service/service-freight/application/usecases/create-service-freight/create-service-freight.service';
import { CreateServiceFreightInputDto, CreateServiceFreightOutputDto } from 'src/app/service/service-freight/application/usecases/create-service-freight/dtos/create-service-freight.dto';
import { DeleteServiceFreight } from 'src/app/service/service-freight/application/usecases/delete-service-freight/delete-service-freight.service';
import { EditServiceFreightInputDto } from 'src/app/service/service-freight/application/usecases/edit-service-freight/dtos/edit-service-freight.dto';
import { EditServiceFreight } from 'src/app/service/service-freight/application/usecases/edit-service-freight/edit-service-freight.service';
import { FindAllServiceFreightQueryDto } from 'src/app/service/service-freight/application/usecases/find-all-service-freight/dtos/find-all-service-freight.dto';
import { FindAllServiceFreight } from 'src/app/service/service-freight/application/usecases/find-all-service-freight/find-all-service-freight.service';
import { FindServiceFreightById } from 'src/app/service/service-freight/application/usecases/find-service-freight-by-id/find-service-freight-by-id.service';
import { UpdateServiceFreightStatus } from 'src/app/service/service-freight/application/usecases/update-service-freight-status/update-service-freight-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceFreightAdminController } from './service-freight-admin.controller';

describe('ServiceFreightAdminController - Unit tests', () => {
  let sut: ServiceFreightAdminController;
  let createServiceFreightService: CreateServiceFreight;
  let findAllServiceFreightService: FindAllServiceFreight;
  let findServiceFreightByIdService: FindServiceFreightById;
  let editServiceFreightService: EditServiceFreight;
  let updateServiceFreightStatusService: UpdateServiceFreightStatus;
  let deleteServiceFreightService: DeleteServiceFreight;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceFreightAdminController],
      providers: [
        { provide: CreateServiceFreight, useValue: createMock<CreateServiceFreight>() },
        { provide: FindAllServiceFreight, useValue: createMock<FindAllServiceFreight>() },
        { provide: FindServiceFreightById, useValue: createMock<FindServiceFreightById>() },
        { provide: EditServiceFreight, useValue: createMock<EditServiceFreight>() },
        { provide: UpdateServiceFreightStatus, useValue: createMock<UpdateServiceFreightStatus>() },
        { provide: DeleteServiceFreight, useValue: createMock<DeleteServiceFreight>() },
      ],
    }).compile();

    sut = module.get(ServiceFreightAdminController);
    createServiceFreightService = module.get(CreateServiceFreight);
    findAllServiceFreightService = module.get(FindAllServiceFreight);
    findServiceFreightByIdService = module.get(FindServiceFreightById);
    editServiceFreightService = module.get(EditServiceFreight);
    updateServiceFreightStatusService = module.get(UpdateServiceFreightStatus);
    deleteServiceFreightService = module.get(DeleteServiceFreight);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceFreight.execute with body', async() => {
      const body = createMock<CreateServiceFreightInputDto>();
      const output = createMock<CreateServiceFreightOutputDto>();
      const createSpy = jest.spyOn(createServiceFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceFreight.execute with queries', async() => {
      const queries = createMock<FindAllServiceFreightQueryDto>();
      const output = createMock<IPagination<ServiceFreightDto>>();
      const findAllSpy = jest.spyOn(findAllServiceFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceFreightById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceFreightDto>();
      const findOneSpy = jest.spyOn(findServiceFreightByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateServiceFreightStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateServiceFreightStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceFreight.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceFreightInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editServiceFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceFreight.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteServiceFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
