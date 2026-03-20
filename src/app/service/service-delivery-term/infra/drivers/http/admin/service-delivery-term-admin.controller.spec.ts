import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceDeliveryTermDto } from 'src/app/service/service-delivery-term/application/dtos/service-delivery-term.dto';
import { CreateServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/create-service-delivery-term/create-service-delivery-term.service';
import { CreateServiceDeliveryTermInputDto, CreateServiceDeliveryTermOutputDto } from 'src/app/service/service-delivery-term/application/usecases/create-service-delivery-term/dtos/create-service-delivery-term.dto';
import { DeleteServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/delete-service-delivery-term/delete-service-delivery-term.service';
import { EditServiceDeliveryTermInputDto } from 'src/app/service/service-delivery-term/application/usecases/edit-service-delivery-term/dtos/edit-service-delivery-term.dto';
import { EditServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/edit-service-delivery-term/edit-service-delivery-term.service';
import { FindAllServiceDeliveryTermQueryDto } from 'src/app/service/service-delivery-term/application/usecases/find-all-service-delivery-term/dtos/find-all-service-delivery-term.dto';
import { FindAllServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/find-all-service-delivery-term/find-all-service-delivery-term.service';
import { FindServiceDeliveryTermById } from 'src/app/service/service-delivery-term/application/usecases/find-service-delivery-term-by-id/find-service-delivery-term-by-id.service';
import { UpdateServiceDeliveryTermStatus } from 'src/app/service/service-delivery-term/application/usecases/update-service-delivery-term-status/update-service-delivery-term-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceDeliveryTermAdminController } from './service-delivery-term-admin.controller';

describe('ServiceDeliveryTermAdminController - Unit tests', () => {
  let sut: ServiceDeliveryTermAdminController;
  let createServiceDeliveryTermService: CreateServiceDeliveryTerm;
  let findAllServiceDeliveryTermService: FindAllServiceDeliveryTerm;
  let findServiceDeliveryTermByIdService: FindServiceDeliveryTermById;
  let editServiceDeliveryTermService: EditServiceDeliveryTerm;
  let updateServiceDeliveryTermStatusService: UpdateServiceDeliveryTermStatus;
  let deleteServiceDeliveryTermService: DeleteServiceDeliveryTerm;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceDeliveryTermAdminController],
      providers: [
        { provide: CreateServiceDeliveryTerm, useValue: createMock<CreateServiceDeliveryTerm>() },
        { provide: FindAllServiceDeliveryTerm, useValue: createMock<FindAllServiceDeliveryTerm>() },
        { provide: FindServiceDeliveryTermById, useValue: createMock<FindServiceDeliveryTermById>() },
        { provide: EditServiceDeliveryTerm, useValue: createMock<EditServiceDeliveryTerm>() },
        { provide: UpdateServiceDeliveryTermStatus, useValue: createMock<UpdateServiceDeliveryTermStatus>() },
        { provide: DeleteServiceDeliveryTerm, useValue: createMock<DeleteServiceDeliveryTerm>() },
      ],
    }).compile();

    sut = module.get(ServiceDeliveryTermAdminController);
    createServiceDeliveryTermService = module.get(CreateServiceDeliveryTerm);
    findAllServiceDeliveryTermService = module.get(FindAllServiceDeliveryTerm);
    findServiceDeliveryTermByIdService = module.get(FindServiceDeliveryTermById);
    editServiceDeliveryTermService = module.get(EditServiceDeliveryTerm);
    updateServiceDeliveryTermStatusService = module.get(UpdateServiceDeliveryTermStatus);
    deleteServiceDeliveryTermService = module.get(DeleteServiceDeliveryTerm);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceDeliveryTerm.execute with body', async() => {
      const body = createMock<CreateServiceDeliveryTermInputDto>();
      const output = createMock<CreateServiceDeliveryTermOutputDto>();
      const createSpy = jest.spyOn(createServiceDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceDeliveryTerm.execute with queries', async() => {
      const queries = createMock<FindAllServiceDeliveryTermQueryDto>();
      const output = createMock<IPagination<ServiceDeliveryTermDto>>();
      const findAllSpy = jest.spyOn(findAllServiceDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceDeliveryTermById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceDeliveryTermDto>();
      const findOneSpy = jest.spyOn(findServiceDeliveryTermByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateServiceDeliveryTermStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateServiceDeliveryTermStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceDeliveryTerm.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceDeliveryTermInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editServiceDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceDeliveryTerm.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteServiceDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
