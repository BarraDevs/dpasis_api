import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProviderDto } from 'src/app/provider/application/dtos/provider.dto';
import { CreateProviderInputDto, CreateProviderOutputDto } from 'src/app/provider/application/usecases/create-provider/dtos/create-provider.dto';
import { ProviderModule } from 'src/app/provider/provider.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProviderController } from './provider.controller';

describe('ProviderController', () => {
  let sut: ProviderController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProviderModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(ProviderController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createProviderService with correct parameters', async() => {
      // Arrange
      const input = createMock<CreateProviderInputDto>();
      const output = createMock<CreateProviderOutputDto>();
      const createProviderSpy = jest.spyOn(sut['createProviderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createProviderSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllProviderService with correct parameters', async() => {
      // Arrange
      const queries = createMock<Queries>();
      const output = createMock<IPagination<ProviderDto>>();
      const findAllProviderSpy = jest.spyOn(sut['findAllProviderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllProviderSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });
  });

  describe('findById', () => {
    it('should call findProviderByIdService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<ProviderDto>();
      const findProviderByIdSpy = jest.spyOn(sut['findProviderByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findProviderByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('update', () => {
    it('should call editProviderService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<CreateProviderInputDto>();
      const output = createMock<SuccessMessage>();
      const editProviderSpy = jest.spyOn(sut['editProviderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editProviderSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });
  });

  describe('updateStatus', () => {
    it('should call updateProviderStatusService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateProviderStatusSpy = jest.spyOn(sut['updateProviderStatusService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(updateProviderStatusSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });
});
