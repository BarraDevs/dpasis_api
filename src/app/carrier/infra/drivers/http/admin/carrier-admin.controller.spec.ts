import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CarrierDto } from 'src/app/carrier/application/dtos/carrier.dto';
import { ActivateCarrier } from 'src/app/carrier/application/usecases/activate-carrier/activate-carrier.service';
import { CreateCarrier } from 'src/app/carrier/application/usecases/create-carrier/create-carrier.service';
import { CreateCarrierInputDto, CreateCarrierOutputDto } from 'src/app/carrier/application/usecases/create-carrier/dtos/create-carrier.dto';
import { DeactivateCarrier } from 'src/app/carrier/application/usecases/deactivate-carrier/deactivate-carrier.service';
import { DeleteCarrier } from 'src/app/carrier/application/usecases/delete-carrier/delete-carrier.service';
import { EditCarrierInputDto } from 'src/app/carrier/application/usecases/edit-carrier/dtos/edit-carrier.dto';
import { EditCarrier } from 'src/app/carrier/application/usecases/edit-carrier/edit-carrier.service';
import { FindAllCarrierQueryDto } from 'src/app/carrier/application/usecases/find-all-carrier/dtos/find-all-carrier.dto';
import { FindAllCarrier } from 'src/app/carrier/application/usecases/find-all-carrier/find-all-carrier.service';
import { FindCarrierById } from 'src/app/carrier/application/usecases/find-carrier-by-id/find-carrier-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CarrierAdminController } from './carrier-admin.controller';

describe('CarrierAdminController - Unit tests', () => {
  let sut: CarrierAdminController;
  let activateCarrierService: ActivateCarrier;
  let createCarrierService: CreateCarrier;
  let deactivateCarrierService: DeactivateCarrier;
  let deleteCarrierService: DeleteCarrier;
  let findAllCarrierService: FindAllCarrier;
  let findCarrierByIdService: FindCarrierById;
  let editCarrierService: EditCarrier;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [CarrierAdminController],
      providers: [
        { provide: ActivateCarrier, useValue: createMock<ActivateCarrier>() },
        { provide: CreateCarrier, useValue: createMock<CreateCarrier>() },
        { provide: DeactivateCarrier, useValue: createMock<DeactivateCarrier>() },
        { provide: DeleteCarrier, useValue: createMock<DeleteCarrier>() },
        { provide: FindAllCarrier, useValue: createMock<FindAllCarrier>() },
        { provide: FindCarrierById, useValue: createMock<FindCarrierById>() },
        { provide: EditCarrier, useValue: createMock<EditCarrier>() },
      ],
    }).compile();

    sut = module.get(CarrierAdminController);
    activateCarrierService = module.get(ActivateCarrier);
    createCarrierService = module.get(CreateCarrier);
    deactivateCarrierService = module.get(DeactivateCarrier);
    deleteCarrierService = module.get(DeleteCarrier);
    findAllCarrierService = module.get(FindAllCarrier);
    findCarrierByIdService = module.get(FindCarrierById);
    editCarrierService = module.get(EditCarrier);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createCarrier.execute with body', async() => {
      const body = createMock<CreateCarrierInputDto>();
      const output = createMock<CreateCarrierOutputDto>();
      const createSpy = jest.spyOn(createCarrierService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllCarrier.execute with queries', async() => {
      const queries = createMock<FindAllCarrierQueryDto>();
      const output = createMock<IPagination<CarrierDto>>();
      const findAllSpy = jest.spyOn(findAllCarrierService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findCarrierById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<CarrierDto>();
      const findOneSpy = jest.spyOn(findCarrierByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateCarrier.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateCarrierService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateCarrier.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateCarrierService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editCarrier.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditCarrierInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editCarrierService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteCarrier.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteCarrierService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
