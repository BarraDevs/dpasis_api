import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceWarrantyDto } from 'src/app/service/service-warranty/application/dtos/service-warranty.dto';
import { CreateServiceWarranty } from 'src/app/service/service-warranty/application/usecases/create-service-warranty/create-service-warranty.service';
import { CreateServiceWarrantyInputDto, CreateServiceWarrantyOutputDto } from 'src/app/service/service-warranty/application/usecases/create-service-warranty/dtos/create-service-warranty.dto';
import { DeleteServiceWarranty } from 'src/app/service/service-warranty/application/usecases/delete-service-warranty/delete-service-warranty.service';
import { EditServiceWarrantyInputDto } from 'src/app/service/service-warranty/application/usecases/edit-service-warranty/dtos/edit-service-warranty.dto';
import { EditServiceWarranty } from 'src/app/service/service-warranty/application/usecases/edit-service-warranty/edit-service-warranty.service';
import { FindAllServiceWarrantyQueryDto } from 'src/app/service/service-warranty/application/usecases/find-all-service-warranty/dtos/find-all-service-warranty.dto';
import { FindAllServiceWarranty } from 'src/app/service/service-warranty/application/usecases/find-all-service-warranty/find-all-service-warranty.service';
import { FindServiceWarrantyById } from 'src/app/service/service-warranty/application/usecases/find-service-warranty-by-id/find-service-warranty-by-id.service';
import { UpdateServiceWarrantyStatus } from 'src/app/service/service-warranty/application/usecases/update-service-warranty-status/update-service-warranty-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceWarrantyAdminController } from './service-warranty-admin.controller';

describe('ServiceWarrantyAdminController - Unit tests', () => {
  let sut: ServiceWarrantyAdminController;
  let createServiceWarrantyService: CreateServiceWarranty;
  let findAllServiceWarrantyService: FindAllServiceWarranty;
  let findServiceWarrantyByIdService: FindServiceWarrantyById;
  let editServiceWarrantyService: EditServiceWarranty;
  let updateServiceWarrantyStatusService: UpdateServiceWarrantyStatus;
  let deleteServiceWarrantyService: DeleteServiceWarranty;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceWarrantyAdminController],
      providers: [
        { provide: CreateServiceWarranty, useValue: createMock<CreateServiceWarranty>() },
        { provide: FindAllServiceWarranty, useValue: createMock<FindAllServiceWarranty>() },
        { provide: FindServiceWarrantyById, useValue: createMock<FindServiceWarrantyById>() },
        { provide: EditServiceWarranty, useValue: createMock<EditServiceWarranty>() },
        { provide: UpdateServiceWarrantyStatus, useValue: createMock<UpdateServiceWarrantyStatus>() },
        { provide: DeleteServiceWarranty, useValue: createMock<DeleteServiceWarranty>() },
      ],
    }).compile();

    sut = module.get(ServiceWarrantyAdminController);
    createServiceWarrantyService = module.get(CreateServiceWarranty);
    findAllServiceWarrantyService = module.get(FindAllServiceWarranty);
    findServiceWarrantyByIdService = module.get(FindServiceWarrantyById);
    editServiceWarrantyService = module.get(EditServiceWarranty);
    updateServiceWarrantyStatusService = module.get(UpdateServiceWarrantyStatus);
    deleteServiceWarrantyService = module.get(DeleteServiceWarranty);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceWarranty.execute with body', async() => {
      const body = createMock<CreateServiceWarrantyInputDto>();
      const output = createMock<CreateServiceWarrantyOutputDto>();
      const createSpy = jest.spyOn(createServiceWarrantyService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceWarranty.execute with queries', async() => {
      const queries = createMock<FindAllServiceWarrantyQueryDto>();
      const output = createMock<IPagination<ServiceWarrantyDto>>();
      const findAllSpy = jest.spyOn(findAllServiceWarrantyService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceWarrantyById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceWarrantyDto>();
      const findOneSpy = jest.spyOn(findServiceWarrantyByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateServiceWarrantyStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateServiceWarrantyStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceWarranty.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceWarrantyInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editServiceWarrantyService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceWarranty.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteServiceWarrantyService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
