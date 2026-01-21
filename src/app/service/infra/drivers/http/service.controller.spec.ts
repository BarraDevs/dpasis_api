import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthorizationGuard } from 'src/app/authentication/application/guards/authorization/authorization.guard';
import { ServiceDto } from 'src/app/service/application/dtos/service.dto';
import { CreateServiceInputDto, CreateServiceOutputDto } from 'src/app/service/application/usecases/create-service/dtos/create-service.dto';
import { EditServiceInputDto } from 'src/app/service/application/usecases/edit-service/dtos/edit-service.dto';
import { FindAllServiceQueryDto } from 'src/app/service/application/usecases/find-all-service/dtos/find-all-service.dto';
import { ServiceModule } from 'src/app/service/service.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceController } from './service.controller';

describe('ServiceController', () => {
  let sut: ServiceController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceModule],
    })
      // Mock the guard to always allow access for controller tests
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    sut = module.get(ServiceController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createServiceService.execute with correct values', async() => {
      // Arrange
      const input = createMock<CreateServiceInputDto>();
      const output = createMock<CreateServiceOutputDto>();
      const createServiceServiceSpy = jest.spyOn(sut['createServiceService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createServiceServiceSpy).toHaveBeenCalledWith(input);
      expect(result).toBe(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllServiceService.execute with correct values', async() => {
      // Arrange
      const queries = createMock<FindAllServiceQueryDto>();
      const output = createMock<IPagination<ServiceDto>>();
      const findAllServiceServiceSpy = jest.spyOn(sut['findAllServiceService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllServiceServiceSpy).toHaveBeenCalledWith(queries);
      expect(result).toBe(output);
    });
  });

  describe('findOne', () => {
    it('should call findServiceByIdService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-service-id' });
      const output = createMock<ServiceDto>();
      const findServiceByIdServiceSpy = jest.spyOn(sut['findServiceByIdService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findServiceByIdServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });

  describe('update', () => {
    it('should call editServiceService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-service-id' });
      const body = createMock<EditServiceInputDto>();
      const output = createMock<SuccessMessage>();
      const editServiceServiceSpy = jest.spyOn(sut['editServiceService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editServiceServiceSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toBe(output);
    });
  });

  describe('updateStatus', () => {
    it('should call updateServiceStatusService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-service-id' });
      const output = createMock<SuccessMessage>();
      const updateServiceStatusServiceSpy = jest.spyOn(sut['updateServiceStatusService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(updateServiceStatusServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });
});
