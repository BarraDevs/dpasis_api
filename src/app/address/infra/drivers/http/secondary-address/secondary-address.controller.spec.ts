import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { CreateAddressInputDto, CreateAddressOutputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { FindAllAddressQueryDto } from 'src/app/address/application/usecases/find-all-address/dtos/find-all-address.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AddressSecondaryController } from './secondary-address.controller';

describe('AddressSecondaryController', () => {
  let sut: AddressSecondaryController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AddressModule,
      ],
    }).compile();

    sut = module.get(AddressSecondaryController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createAddressService with correct parameters', async() => {
      const input = createMock<CreateAddressInputDto>();
      const output = createMock<CreateAddressOutputDto>();
      const createAddressServiceSpy = jest.spyOn(sut['createAddressService'], 'execute').mockResolvedValue(output);

      const result = await sut.create(input);

      expect(createAddressServiceSpy).toHaveBeenCalledWith(input, false);
      expect(result).toBe(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllAddressService with correct parameters', async() => {
      const queries = createMock<FindAllAddressQueryDto>();
      const output = createMock<IPagination<AddressDto>>();
      const findAllAddressServiceSpy = jest.spyOn(sut['findAllAddressService'], 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(findAllAddressServiceSpy).toHaveBeenCalledWith({ ...queries, isMain: false });
      expect(result).toBe(output);
    });
  });

  describe('findOne', () => {
    it('should call findOneAddressService with correct parameters', async() => {
      const id = 'some-id';
      const output = createMock<AddressDto>();
      const findOneAddressServiceSpy = jest.spyOn(sut['findAddressByIdService'], 'execute').mockResolvedValue(output);

      const result = await sut.findOne({ id });

      expect(findOneAddressServiceSpy).toHaveBeenCalledWith(id, false);
      expect(result).toBe(output);
    });
  });

  describe('update', () => {
    it('should call editAddressService with correct parameters', async() => {
      const id = 'some-id';
      const body = createMock<EditAddressInputDto>();
      const output = createMock<SuccessMessage>();
      const editAddressServiceSpy = jest.spyOn(sut['editAddressService'], 'execute').mockResolvedValue(output);

      const result = await sut.update({ id }, body);

      expect(editAddressServiceSpy).toHaveBeenCalledWith(id, false, body);
      expect(result).toBe(output);
    });
  });

  describe('remove', () => {
    it('should call deleteAddressService with correct parameters', async() => {
      const id = 'some-id';
      const output = createMock<SuccessMessage>();
      const deleteAddressServiceSpy = jest.spyOn(sut['deleteAddressService'], 'execute').mockResolvedValue(output);

      const result = await sut.remove({ id });

      expect(deleteAddressServiceSpy).toHaveBeenCalledWith(id);
      expect(result).toBe(output);
    });
  });
});
