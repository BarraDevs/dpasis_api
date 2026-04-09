import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { WarrantyDto } from 'src/app/global/warranty/application/dtos/warranty.dto';
import { CreateWarranty } from 'src/app/global/warranty/application/usecases/create-warranty/create-warranty.service';
import { CreateWarrantyInputDto, CreateWarrantyOutputDto } from 'src/app/global/warranty/application/usecases/create-warranty/dtos/create-warranty.dto';
import { DeleteWarranty } from 'src/app/global/warranty/application/usecases/delete-warranty/delete-warranty.service';
import { EditWarrantyInputDto } from 'src/app/global/warranty/application/usecases/edit-warranty/dtos/edit-warranty.dto';
import { EditWarranty } from 'src/app/global/warranty/application/usecases/edit-warranty/edit-warranty.service';
import { FindAllWarrantyQueryDto } from 'src/app/global/warranty/application/usecases/find-all-warranty/dtos/find-all-warranty.dto';
import { FindAllWarranty } from 'src/app/global/warranty/application/usecases/find-all-warranty/find-all-warranty.service';
import { FindWarrantyById } from 'src/app/global/warranty/application/usecases/find-warranty-by-id/find-warranty-by-id.service';
import { UpdateWarrantyStatus } from 'src/app/global/warranty/application/usecases/update-warranty-status/update-warranty-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { WarrantyAdminController } from './warranty-admin.controller';

describe('WarrantyAdminController - Unit tests', () => {
  let sut: WarrantyAdminController;
  let createWarranty: CreateWarranty;
  let findAllWarranty: FindAllWarranty;
  let findWarrantyById: FindWarrantyById;
  let editWarranty: EditWarranty;
  let updateWarrantyStatus: UpdateWarrantyStatus;
  let deleteWarranty: DeleteWarranty;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [WarrantyAdminController],
      providers: [
        { provide: CreateWarranty, useValue: createMock<CreateWarranty>() },
        { provide: FindAllWarranty, useValue: createMock<FindAllWarranty>() },
        { provide: FindWarrantyById, useValue: createMock<FindWarrantyById>() },
        { provide: EditWarranty, useValue: createMock<EditWarranty>() },
        { provide: UpdateWarrantyStatus, useValue: createMock<UpdateWarrantyStatus>() },
        { provide: DeleteWarranty, useValue: createMock<DeleteWarranty>() },
      ],
    }).compile();

    sut = module.get(WarrantyAdminController);
    createWarranty = module.get(CreateWarranty);
    findAllWarranty = module.get(FindAllWarranty);
    findWarrantyById = module.get(FindWarrantyById);
    editWarranty = module.get(EditWarranty);
    updateWarrantyStatus = module.get(UpdateWarrantyStatus);
    deleteWarranty = module.get(DeleteWarranty);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createWarranty.execute with body', async() => {
      const body = createMock<CreateWarrantyInputDto>();
      const output = createMock<CreateWarrantyOutputDto>();
      const createSpy = jest.spyOn(createWarranty, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllWarranty.execute with queries', async() => {
      const queries = createMock<FindAllWarrantyQueryDto>();
      const output = createMock<IPagination<WarrantyDto>>();
      const findAllSpy = jest.spyOn(findAllWarranty, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findWarrantyById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<WarrantyDto>();
      const findOneSpy = jest.spyOn(findWarrantyById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateWarrantyStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateWarrantyStatus, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editWarranty.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditWarrantyInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editWarranty, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteWarranty.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteWarranty, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
