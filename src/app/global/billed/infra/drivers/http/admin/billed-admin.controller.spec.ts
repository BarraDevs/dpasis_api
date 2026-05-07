import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BilledDto } from 'src/app/global/billed/application/dtos/billed.dto';
import { ActivateBilled } from 'src/app/global/billed/application/usecases/activate-billed/activate-billed.service';
import { CreateBilled } from 'src/app/global/billed/application/usecases/create-billed/create-billed.service';
import { CreateBilledInputDto, CreateBilledOutputDto } from 'src/app/global/billed/application/usecases/create-billed/dtos/create-billed.dto';
import { DeactivateBilled } from 'src/app/global/billed/application/usecases/deactivate-billed/deactivate-billed.service';
import { DeleteBilled } from 'src/app/global/billed/application/usecases/delete-billed/delete-billed.service';
import { EditBilledInputDto } from 'src/app/global/billed/application/usecases/edit-billed/dtos/edit-billed.dto';
import { EditBilled } from 'src/app/global/billed/application/usecases/edit-billed/edit-billed.service';
import { FindAllBilledQueryDto } from 'src/app/global/billed/application/usecases/find-all-billed/dtos/find-all-billed.dto';
import { FindAllBilled } from 'src/app/global/billed/application/usecases/find-all-billed/find-all-billed.service';
import { FindBilledById } from 'src/app/global/billed/application/usecases/find-billed-by-id/find-billed-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { BilledAdminController } from './billed-admin.controller';

describe('BilledAdminController - Unit tests', () => {
  let sut: BilledAdminController;
  let activateBilled: ActivateBilled;
  let createBilled: CreateBilled;
  let deactivateBilled: DeactivateBilled;
  let findAllBilled: FindAllBilled;
  let findBilledById: FindBilledById;
  let editBilled: EditBilled;
  let deleteBilled: DeleteBilled;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [BilledAdminController],
      providers: [
        { provide: ActivateBilled, useValue: createMock<ActivateBilled>() },
        { provide: CreateBilled, useValue: createMock<CreateBilled>() },
        { provide: DeactivateBilled, useValue: createMock<DeactivateBilled>() },
        { provide: FindAllBilled, useValue: createMock<FindAllBilled>() },
        { provide: FindBilledById, useValue: createMock<FindBilledById>() },
        { provide: EditBilled, useValue: createMock<EditBilled>() },
        { provide: DeleteBilled, useValue: createMock<DeleteBilled>() },
      ],
    }).compile();

    sut = module.get(BilledAdminController);
    activateBilled = module.get(ActivateBilled);
    createBilled = module.get(CreateBilled);
    deactivateBilled = module.get(DeactivateBilled);
    findAllBilled = module.get(FindAllBilled);
    findBilledById = module.get(FindBilledById);
    editBilled = module.get(EditBilled);
    deleteBilled = module.get(DeleteBilled);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createBilled.execute with body', async() => {
      const body = createMock<CreateBilledInputDto>();
      const output = createMock<CreateBilledOutputDto>();
      const createSpy = jest.spyOn(createBilled, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllBilled.execute with queries', async() => {
      const queries = createMock<FindAllBilledQueryDto>();
      const output = createMock<IPagination<BilledDto>>();
      const findAllSpy = jest.spyOn(findAllBilled, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findBilledById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<BilledDto>();
      const findOneSpy = jest.spyOn(findBilledById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateBilled.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateBilled, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateBilled.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateBilled, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editBilled.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditBilledInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editBilled, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteBilled.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteBilled, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
