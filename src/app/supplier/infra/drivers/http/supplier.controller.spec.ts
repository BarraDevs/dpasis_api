import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { SupplierDto } from 'src/app/supplier/application/dtos/supplier.dto';
import { CreateSupplierInputDto, CreateSupplierOutputDto } from 'src/app/supplier/application/usecases/create-supplier/dtos/create-supplier.dto';
import { FindAllSupplierQueryDto } from 'src/app/supplier/application/usecases/find-all-supplier/dtos/find-all-supplier.dto';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SupplierController } from './supplier.controller';

describe('SupplierController', () => {
  let sut: SupplierController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(SupplierController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createSupplierService with correct parameters', async() => {
      // Arrange
      const input = createMock<CreateSupplierInputDto>();
      const output = createMock<CreateSupplierOutputDto>();
      const createSupplierSpy = jest.spyOn(sut['createSupplierService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createSupplierSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllSupplierService with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllSupplierQueryDto>();
      const output = createMock<IPagination<SupplierDto>>();
      const findAllSupplierSpy = jest.spyOn(sut['findAllSupplierService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllSupplierSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });
  });

  describe('findById', () => {
    it('should call findSupplierByIdService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SupplierDto>();
      const findSupplierByIdSpy = jest.spyOn(sut['findSupplierByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findSupplierByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('update', () => {
    it('should call editSupplierService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<CreateSupplierInputDto>();
      const output = createMock<SuccessMessage>();
      const editSupplierSpy = jest.spyOn(sut['editSupplierService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editSupplierSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });
  });

  describe('updateStatus', () => {
    it('should call updateSupplierStatusService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateSupplierStatusSpy = jest.spyOn(sut['updateSupplierStatusService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(updateSupplierStatusSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });
});
