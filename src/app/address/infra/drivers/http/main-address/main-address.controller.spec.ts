import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { CreateAddressInputDto, CreateAddressOutputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
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
      // Arrange
      const input = createMock<CreateAddressInputDto>();
      const output = createMock<CreateAddressOutputDto>();
      const createAddressService = jest.spyOn(sut['createAddressService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createAddressService).toHaveBeenCalledWith(input, true);
      expect(result).toBe(output);
    });
  });

  describe('findOne', () => {
    it('should call findMainAddressService.execute with correct params', async() => {
      // Arrange
      const params = createMock<Params>();
      const findMainAddressService = jest.spyOn(sut['findMainAddressService'], 'execute').mockResolvedValue(null);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findMainAddressService).toHaveBeenCalledWith(params.id);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should call editAddressService.execute with correct params', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditAddressInputDto>();
      const successMessage: SuccessMessage = { message: 'Endereço atualizado com sucesso' };
      const editAddressService = jest.spyOn(sut['editAddressService'], 'execute').mockResolvedValue(successMessage);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editAddressService).toHaveBeenCalledWith(params.id, true, body);
      expect(result).toBe(successMessage);
    });
  });
});
