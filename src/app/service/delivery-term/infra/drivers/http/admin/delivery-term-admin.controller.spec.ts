import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { DeliveryTermDto } from 'src/app/service/delivery-term/application/dtos/delivery-term.dto';
import { CreateDeliveryTerm } from 'src/app/service/delivery-term/application/usecases/create-delivery-term/create-delivery-term.service';
import { CreateDeliveryTermInputDto, CreateDeliveryTermOutputDto } from 'src/app/service/delivery-term/application/usecases/create-delivery-term/dtos/create-delivery-term.dto';
import { DeleteDeliveryTerm } from 'src/app/service/delivery-term/application/usecases/delete-delivery-term/delete-delivery-term.service';
import { EditDeliveryTermInputDto } from 'src/app/service/delivery-term/application/usecases/edit-delivery-term/dtos/edit-delivery-term.dto';
import { EditDeliveryTerm } from 'src/app/service/delivery-term/application/usecases/edit-delivery-term/edit-delivery-term.service';
import { FindAllDeliveryTermQueryDto } from 'src/app/service/delivery-term/application/usecases/find-all-delivery-term/dtos/find-all-delivery-term.dto';
import { FindAllDeliveryTerm } from 'src/app/service/delivery-term/application/usecases/find-all-delivery-term/find-all-delivery-term.service';
import { FindDeliveryTermById } from 'src/app/service/delivery-term/application/usecases/find-delivery-term-by-id/find-delivery-term-by-id.service';
import { UpdateDeliveryTermStatus } from 'src/app/service/delivery-term/application/usecases/update-delivery-term-status/update-delivery-term-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { DeliveryTermAdminController } from './delivery-term-admin.controller';

describe('DeliveryTermAdminController - Unit tests', () => {
  let sut: DeliveryTermAdminController;
  let createDeliveryTermService: CreateDeliveryTerm;
  let findAllDeliveryTermService: FindAllDeliveryTerm;
  let findDeliveryTermByIdService: FindDeliveryTermById;
  let editDeliveryTermService: EditDeliveryTerm;
  let updateDeliveryTermStatusService: UpdateDeliveryTermStatus;
  let deleteDeliveryTermService: DeleteDeliveryTerm;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [DeliveryTermAdminController],
      providers: [
        { provide: CreateDeliveryTerm, useValue: createMock<CreateDeliveryTerm>() },
        { provide: FindAllDeliveryTerm, useValue: createMock<FindAllDeliveryTerm>() },
        { provide: FindDeliveryTermById, useValue: createMock<FindDeliveryTermById>() },
        { provide: EditDeliveryTerm, useValue: createMock<EditDeliveryTerm>() },
        { provide: UpdateDeliveryTermStatus, useValue: createMock<UpdateDeliveryTermStatus>() },
        { provide: DeleteDeliveryTerm, useValue: createMock<DeleteDeliveryTerm>() },
      ],
    }).compile();

    sut = module.get(DeliveryTermAdminController);
    createDeliveryTermService = module.get(CreateDeliveryTerm);
    findAllDeliveryTermService = module.get(FindAllDeliveryTerm);
    findDeliveryTermByIdService = module.get(FindDeliveryTermById);
    editDeliveryTermService = module.get(EditDeliveryTerm);
    updateDeliveryTermStatusService = module.get(UpdateDeliveryTermStatus);
    deleteDeliveryTermService = module.get(DeleteDeliveryTerm);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createDeliveryTerm.execute with body', async() => {
      const body = createMock<CreateDeliveryTermInputDto>();
      const output = createMock<CreateDeliveryTermOutputDto>();
      const createSpy = jest.spyOn(createDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllDeliveryTerm.execute with queries', async() => {
      const queries = createMock<FindAllDeliveryTermQueryDto>();
      const output = createMock<IPagination<DeliveryTermDto>>();
      const findAllSpy = jest.spyOn(findAllDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findDeliveryTermById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<DeliveryTermDto>();
      const findOneSpy = jest.spyOn(findDeliveryTermByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateDeliveryTermStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateDeliveryTermStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editDeliveryTerm.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditDeliveryTermInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteDeliveryTerm.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteDeliveryTermService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
