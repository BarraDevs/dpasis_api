import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ShipperDto } from 'src/app/shipper/application/dtos/shipper.dto';
import { CreateShipperInputDto, CreateShipperOutputDto } from 'src/app/shipper/application/usecases/create-shipper/dtos/create-shipper.dto';
import { EditShipperInputDto } from 'src/app/shipper/application/usecases/edit-shipper/dtos/edit-shipper.dto';
import { FindAllShipperQueryDto } from 'src/app/shipper/application/usecases/find-all-shipper/dtos/find-all-shipper.dto';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ShipperController } from './shipper.controller';

describe('ShipperController', () => {
  let sut: ShipperController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(ShipperController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createShipperService with correct parameters', async() => {
      // Arrange
      const input = createMock<CreateShipperInputDto>();
      const output = createMock<CreateShipperOutputDto>();
      const createShipperSpy = jest.spyOn(sut['createShipperService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createShipperSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllShipperService with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllShipperQueryDto>();
      const output = createMock<IPagination<ShipperDto>>();
      const findAllShipperSpy = jest.spyOn(sut['findAllShipperService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllShipperSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });
  });

  describe('findOne', () => {
    it('should call findShipperByIdService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ShipperDto>();
      const findShipperByIdSpy = jest.spyOn(sut['findShipperByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findShipperByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('update', () => {
    it('should call editShipperService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditShipperInputDto>();
      const output = createMock<SuccessMessage>();
      const editShipperSpy = jest.spyOn(sut['editShipperService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editShipperSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });
  });

  describe('updateStatus', () => {
    it('should call updateShipperStatusService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateShipperStatusSpy = jest.spyOn(sut['updateShipperStatusService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(updateShipperStatusSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });
});
