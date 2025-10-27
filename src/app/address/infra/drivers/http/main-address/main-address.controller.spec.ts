import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { CreateAddressInputDto, CreateAddressOutputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { AddressMainController } from './main-address.controller';

describe('AddressMainController', () => {
  let sut: AddressMainController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AddressModule,
      ],
    }).compile();

    sut = module.get(AddressMainController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createAddressService.execute with correct params', async() => {
      const input = createMock<CreateAddressInputDto>({});
      const output = createMock<CreateAddressOutputDto>({});
      const createAddressService = jest.spyOn(sut['createAddressService'], 'execute').mockResolvedValue(output);

      const result = await sut.create(input);

      expect(createAddressService).toHaveBeenCalledWith(input, true);
      expect(result).toBe(output);
    });
  });

  describe('findOne', () => {
    it('should call findMainAddressService.execute with correct params', async() => {
      const ownerId = 'any_owner_id';
      const findMainAddressService = jest.spyOn(sut['findMainAddressService'], 'execute').mockResolvedValue(null);

      const result = await sut.findOne({ id: ownerId });

      expect(findMainAddressService).toHaveBeenCalledWith(ownerId);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should call editAddressService.execute with correct params', async() => {
      const addressId = 'any_address_id';
      const body = {};
      const successMessage: SuccessMessage = { message: 'Endereço atualizado com sucesso' };
      const editAddressService = jest.spyOn(sut['editAddressService'], 'execute').mockResolvedValue(successMessage);

      const result = await sut.update({ id: addressId }, body);

      expect(editAddressService).toHaveBeenCalledWith(addressId, true, body);
      expect(result).toBe(successMessage);
    });
  });
});
