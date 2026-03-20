import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceProposalValidityDto } from 'src/app/service/service-proposal-validity/application/dtos/service-proposal-validity.dto';
import { CreateServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/create-service-proposal-validity/create-service-proposal-validity.service';
import { CreateServiceProposalValidityInputDto, CreateServiceProposalValidityOutputDto } from 'src/app/service/service-proposal-validity/application/usecases/create-service-proposal-validity/dtos/create-service-proposal-validity.dto';
import { DeleteServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/delete-service-proposal-validity/delete-service-proposal-validity.service';
import { EditServiceProposalValidityInputDto } from 'src/app/service/service-proposal-validity/application/usecases/edit-service-proposal-validity/dtos/edit-service-proposal-validity.dto';
import { EditServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/edit-service-proposal-validity/edit-service-proposal-validity.service';
import { FindAllServiceProposalValidityQueryDto } from 'src/app/service/service-proposal-validity/application/usecases/find-all-service-proposal-validity/dtos/find-all-service-proposal-validity.dto';
import { FindAllServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/find-all-service-proposal-validity/find-all-service-proposal-validity.service';
import { FindServiceProposalValidityById } from 'src/app/service/service-proposal-validity/application/usecases/find-service-proposal-validity-by-id/find-service-proposal-validity-by-id.service';
import { UpdateServiceProposalValidityStatus } from 'src/app/service/service-proposal-validity/application/usecases/update-service-proposal-validity-status/update-service-proposal-validity-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceProposalValidityAdminController } from './service-proposal-validity-admin.controller';

describe('ServiceProposalValidityAdminController - Unit tests', () => {
  let sut: ServiceProposalValidityAdminController;
  let createServiceProposalValidityService: CreateServiceProposalValidity;
  let findAllServiceProposalValidityService: FindAllServiceProposalValidity;
  let findServiceProposalValidityByIdService: FindServiceProposalValidityById;
  let editServiceProposalValidityService: EditServiceProposalValidity;
  let updateServiceProposalValidityStatusService: UpdateServiceProposalValidityStatus;
  let deleteServiceProposalValidityService: DeleteServiceProposalValidity;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ServiceProposalValidityAdminController],
      providers: [
        { provide: CreateServiceProposalValidity, useValue: createMock<CreateServiceProposalValidity>() },
        { provide: FindAllServiceProposalValidity, useValue: createMock<FindAllServiceProposalValidity>() },
        { provide: FindServiceProposalValidityById, useValue: createMock<FindServiceProposalValidityById>() },
        { provide: EditServiceProposalValidity, useValue: createMock<EditServiceProposalValidity>() },
        { provide: UpdateServiceProposalValidityStatus, useValue: createMock<UpdateServiceProposalValidityStatus>() },
        { provide: DeleteServiceProposalValidity, useValue: createMock<DeleteServiceProposalValidity>() },
      ],
    }).compile();

    sut = module.get(ServiceProposalValidityAdminController);
    createServiceProposalValidityService = module.get(CreateServiceProposalValidity);
    findAllServiceProposalValidityService = module.get(FindAllServiceProposalValidity);
    findServiceProposalValidityByIdService = module.get(FindServiceProposalValidityById);
    editServiceProposalValidityService = module.get(EditServiceProposalValidity);
    updateServiceProposalValidityStatusService = module.get(UpdateServiceProposalValidityStatus);
    deleteServiceProposalValidityService = module.get(DeleteServiceProposalValidity);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceProposalValidity.execute with body', async() => {
      const body = createMock<CreateServiceProposalValidityInputDto>();
      const output = createMock<CreateServiceProposalValidityOutputDto>();
      const createSpy = jest.spyOn(createServiceProposalValidityService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceProposalValidity.execute with queries', async() => {
      const queries = createMock<FindAllServiceProposalValidityQueryDto>();
      const output = createMock<IPagination<ServiceProposalValidityDto>>();
      const findAllSpy = jest.spyOn(findAllServiceProposalValidityService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findServiceProposalValidityById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ServiceProposalValidityDto>();
      const findOneSpy = jest.spyOn(findServiceProposalValidityByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateServiceProposalValidityStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateServiceProposalValidityStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editServiceProposalValidity.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditServiceProposalValidityInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editServiceProposalValidityService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteServiceProposalValidity.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteServiceProposalValidityService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
