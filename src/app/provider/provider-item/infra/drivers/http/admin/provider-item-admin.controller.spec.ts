import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ProviderItemDto } from 'src/app/provider/provider-item/application/dtos/provider-item.dto';
import { ActivateProviderItem } from 'src/app/provider/provider-item/application/usecases/activate-provider-item/activate-provider-item.service';
import { CreateProviderItem } from 'src/app/provider/provider-item/application/usecases/create-provider-item/create-provider-item.service';
import {
  CreateProviderItemInputDto,
  CreateProviderItemOutputDto,
} from 'src/app/provider/provider-item/application/usecases/create-provider-item/dtos/create-provider-item.dto';
import { DeactivateProviderItem } from 'src/app/provider/provider-item/application/usecases/deactivate-provider-item/deactivate-provider-item.service';
import { DeleteProviderItem } from 'src/app/provider/provider-item/application/usecases/delete-provider-item/delete-provider-item.service';
import { EditProviderItemInputDto } from 'src/app/provider/provider-item/application/usecases/edit-provider-item/dtos/edit-provider-item.dto';
import { EditProviderItem } from 'src/app/provider/provider-item/application/usecases/edit-provider-item/edit-provider-item.service';
import { FindAllProviderItemQueryDto } from 'src/app/provider/provider-item/application/usecases/find-all-provider-item/dtos/find-all-provider-item.dto';
import { FindAllProviderItem } from 'src/app/provider/provider-item/application/usecases/find-all-provider-item/find-all-provider-item.service';
import { FindProviderItemById } from 'src/app/provider/provider-item/application/usecases/find-provider-item-by-id/find-provider-item-by-id.service';
import { PayProviderItemInstallment } from 'src/app/provider/provider-item/application/usecases/pay-provider-item-installment/pay-provider-item-installment.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params, ParamsProviderItemInstallmentId } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProviderItemAdminController } from './provider-item-admin.controller';

describe('ProviderItemAdminController - Unit tests', () => {
  let sut: ProviderItemAdminController;
  let activateProviderItemService: ActivateProviderItem;
  let createProviderItemService: CreateProviderItem;
  let deactivateProviderItemService: DeactivateProviderItem;
  let deleteProviderItemService: DeleteProviderItem;
  let findAllProviderItemService: FindAllProviderItem;
  let findProviderItemByIdService: FindProviderItemById;
  let editProviderItemService: EditProviderItem;
  let payProviderItemInstallmentService: PayProviderItemInstallment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ProviderItemAdminController],
      providers: [
        { provide: ActivateProviderItem, useValue: createMock<ActivateProviderItem>() },
        { provide: CreateProviderItem, useValue: createMock<CreateProviderItem>() },
        { provide: DeactivateProviderItem, useValue: createMock<DeactivateProviderItem>() },
        { provide: DeleteProviderItem, useValue: createMock<DeleteProviderItem>() },
        { provide: FindAllProviderItem, useValue: createMock<FindAllProviderItem>() },
        { provide: FindProviderItemById, useValue: createMock<FindProviderItemById>() },
        { provide: EditProviderItem, useValue: createMock<EditProviderItem>() },
        { provide: PayProviderItemInstallment, useValue: createMock<PayProviderItemInstallment>() },
      ],
    }).compile();

    sut = module.get(ProviderItemAdminController);
    activateProviderItemService = module.get(ActivateProviderItem);
    createProviderItemService = module.get(CreateProviderItem);
    deactivateProviderItemService = module.get(DeactivateProviderItem);
    deleteProviderItemService = module.get(DeleteProviderItem);
    findAllProviderItemService = module.get(FindAllProviderItem);
    findProviderItemByIdService = module.get(FindProviderItemById);
    editProviderItemService = module.get(EditProviderItem);
    payProviderItemInstallmentService = module.get(PayProviderItemInstallment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createProviderItem.execute with body', async() => {
      const body = createMock<CreateProviderItemInputDto>();
      const output = createMock<CreateProviderItemOutputDto>();
      const createSpy = jest.spyOn(createProviderItemService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllProviderItem.execute with queries', async() => {
      const queries = createMock<FindAllProviderItemQueryDto>();
      const output = createMock<IPagination<ProviderItemDto>>();
      const findAllSpy = jest.spyOn(findAllProviderItemService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findProviderItemById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ProviderItemDto>();
      const findOneSpy = jest.spyOn(findProviderItemByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('payInstallment', () => {
    it('should call payProviderItemInstallment.execute with params.id and params.installmentId', async() => {
      const params = createMock<ParamsProviderItemInstallmentId>();
      const output = createMock<SuccessMessage>();
      const paySpy = jest.spyOn(payProviderItemInstallmentService, 'execute').mockResolvedValue(output);

      const result = await sut.payInstallment(params);

      expect(result).toEqual(output);
      expect(paySpy).toHaveBeenCalledWith(params.id, params.installmentId);
    });
  });

  describe('activate', () => {
    it('should call activateProviderItem.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateProviderItemService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateProviderItem.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateProviderItemService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editProviderItem.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditProviderItemInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editProviderItemService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteProviderItem.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deleteSpy = jest.spyOn(deleteProviderItemService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(deleteSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
