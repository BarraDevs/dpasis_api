import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import { CreateSellerInputDto, CreateSellerOutputDto } from 'src/app/seller/application/usecases/create-seller/dtos/create-seller.dto';
import { SellerModule } from 'src/app/seller/seller.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SellerController } from './seller.controller';

describe('SellerController', () => {
  let sut: SellerController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        SellerModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(SellerController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createSellerService with correct parameters', async() => {
      // Arrange
      const input = createMock<CreateSellerInputDto>();
      const output = createMock<CreateSellerOutputDto>();
      const createSellerSpy = jest.spyOn(sut['createSellerService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createSellerSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllSellerService with correct parameters', async() => {
      // Arrange
      const queries = createMock<Queries>();
      const output = createMock<IPagination<SellerDto>>();
      const findAllSellerSpy = jest.spyOn(sut['findAllSellerService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllSellerSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });
  });

  describe('findById', () => {
    it('should call findSellerByIdService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SellerDto>();
      const findSellerByIdSpy = jest.spyOn(sut['findSellerByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findSellerByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('update', () => {
    it('should call editSellerService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<CreateSellerInputDto>();
      const output = createMock<SuccessMessage>();
      const editSellerSpy = jest.spyOn(sut['editSellerService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editSellerSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });
  });

  describe('updateStatus', () => {
    it('should call updateSellerStatusService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateSellerStatusSpy = jest.spyOn(sut['updateSellerStatusService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(updateSellerStatusSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });
});
