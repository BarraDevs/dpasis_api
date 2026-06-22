import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import { ActivateSeller } from 'src/app/seller/application/usecases/activate-seller/activate-seller.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateSellerInputDto, CreateSellerOutputDto } from 'src/app/seller/application/usecases/create-seller/dtos/create-seller.dto';
import { DeactivateSeller } from 'src/app/seller/application/usecases/deactivate-seller/deactivate-seller.service';
import { DeleteSeller } from 'src/app/seller/application/usecases/delete-seller/delete-seller.service';
import { EditSellerInputDto } from 'src/app/seller/application/usecases/edit-seller/dtos/edit-seller.dto';
import { EditSeller } from 'src/app/seller/application/usecases/edit-seller/edit-seller.service';
import { FindAllSellerQueryDto } from 'src/app/seller/application/usecases/find-all-seller/dtos/find-all-seller.dto';
import { FindAllSeller } from 'src/app/seller/application/usecases/find-all-seller/find-all-seller.service';
import { FindSellerById } from 'src/app/seller/application/usecases/find-seller-by-id/find-seller-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SellerAdminController } from './seller-admin.controller';

describe('SellerAdminController - Unit tests', () => {
  let sut: SellerAdminController;
  let activateSellerService: ActivateSeller;
  let createSellerService: CreateSeller;
  let deactivateSellerService: DeactivateSeller;
  let deleteSellerService: DeleteSeller;
  let findAllSellerService: FindAllSeller;
  let findSellerByIdService: FindSellerById;
  let editSellerService: EditSeller;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [SellerAdminController],
      providers: [
        { provide: ActivateSeller, useValue: createMock<ActivateSeller>() },
        { provide: CreateSeller, useValue: createMock<CreateSeller>() },
        { provide: DeactivateSeller, useValue: createMock<DeactivateSeller>() },
        { provide: DeleteSeller, useValue: createMock<DeleteSeller>() },
        { provide: FindAllSeller, useValue: createMock<FindAllSeller>() },
        { provide: FindSellerById, useValue: createMock<FindSellerById>() },
        { provide: EditSeller, useValue: createMock<EditSeller>() },
      ],
    }).compile();

    sut = module.get(SellerAdminController);
    activateSellerService = module.get(ActivateSeller);
    createSellerService = module.get(CreateSeller);
    deactivateSellerService = module.get(DeactivateSeller);
    deleteSellerService = module.get(DeleteSeller);
    findAllSellerService = module.get(FindAllSeller);
    findSellerByIdService = module.get(FindSellerById);
    editSellerService = module.get(EditSeller);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createSeller.execute with body', async() => {
      const body = createMock<CreateSellerInputDto>();
      const output = createMock<CreateSellerOutputDto>();
      const createSpy = jest.spyOn(createSellerService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllSeller.execute with queries', async() => {
      const queries = createMock<FindAllSellerQueryDto>();
      const output = createMock<IPagination<SellerDto>>();
      const findAllSpy = jest.spyOn(findAllSellerService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findSellerById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SellerDto>();
      const findOneSpy = jest.spyOn(findSellerByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateSeller.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateSellerService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateSeller.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateSellerService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editSeller.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditSellerInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editSellerService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteSeller.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteSellerService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
