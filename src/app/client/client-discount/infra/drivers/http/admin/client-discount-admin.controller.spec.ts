import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDiscountDto } from 'src/app/client/client-discount/application/dtos/client-discount.dto';
import { CreateClientDiscount } from 'src/app/client/client-discount/application/usecases/create-client-discount/create-client-discount.service';
import {
  CreateClientDiscountInputDto,
  CreateClientDiscountOutputDto,
} from 'src/app/client/client-discount/application/usecases/create-client-discount/dtos/create-client-discount.dto';
import { DeleteClientDiscount } from 'src/app/client/client-discount/application/usecases/delete-client-discount/delete-client-discount.service';
import { EditClientDiscountInputDto } from 'src/app/client/client-discount/application/usecases/edit-client-discount/dtos/edit-client-discount.dto';
import { EditClientDiscount } from 'src/app/client/client-discount/application/usecases/edit-client-discount/edit-client-discount.service';
import { FindAllClientDiscountQueryDto } from 'src/app/client/client-discount/application/usecases/find-all-client-discount/dtos/find-all-client-discount.dto';
import { FindAllClientDiscount } from 'src/app/client/client-discount/application/usecases/find-all-client-discount/find-all-client-discount.service';
import { FindClientDiscountById } from 'src/app/client/client-discount/application/usecases/find-client-discount-by-id/find-client-discount-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDiscountAdminController } from './client-discount-admin.controller';

describe('ClientDiscountAdminController - Unit tests', () => {
  let sut: ClientDiscountAdminController;
  let createClientDiscountService: CreateClientDiscount;
  let findAllClientDiscountService: FindAllClientDiscount;
  let findClientDiscountByIdService: FindClientDiscountById;
  let editClientDiscountService: EditClientDiscount;
  let deleteClientDiscountService: DeleteClientDiscount;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientDiscountAdminController],
      providers: [
        { provide: CreateClientDiscount, useValue: createMock<CreateClientDiscount>() },
        { provide: FindAllClientDiscount, useValue: createMock<FindAllClientDiscount>() },
        { provide: FindClientDiscountById, useValue: createMock<FindClientDiscountById>() },
        { provide: EditClientDiscount, useValue: createMock<EditClientDiscount>() },
        { provide: DeleteClientDiscount, useValue: createMock<DeleteClientDiscount>() },
      ],
    }).compile();

    sut = module.get(ClientDiscountAdminController);
    createClientDiscountService = module.get(CreateClientDiscount);
    findAllClientDiscountService = module.get(FindAllClientDiscount);
    findClientDiscountByIdService = module.get(FindClientDiscountById);
    editClientDiscountService = module.get(EditClientDiscount);
    deleteClientDiscountService = module.get(DeleteClientDiscount);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientDiscount.execute with body', async() => {
      const body = createMock<CreateClientDiscountInputDto>();
      const output = createMock<CreateClientDiscountOutputDto>();
      const createSpy = jest.spyOn(createClientDiscountService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientDiscount.execute with queries', async() => {
      const queries = createMock<FindAllClientDiscountQueryDto>();
      const output = createMock<IPagination<ClientDiscountDto>>();
      const findAllSpy = jest.spyOn(findAllClientDiscountService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientDiscountById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientDiscountDto>();
      const findOneSpy = jest.spyOn(findClientDiscountByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientDiscount.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientDiscountInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientDiscountService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientDiscount.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientDiscountService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
