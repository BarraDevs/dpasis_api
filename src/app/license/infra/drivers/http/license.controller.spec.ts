import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthorizationGuard } from 'src/app/authentication/application/guards/authorization/authorization.guard';
import { LicenseDto } from 'src/app/license/application/dtos/license.dto';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from 'src/app/license/application/usecases/create-license/dtos/create-license.dto';
import { EditLicenseInputDto } from 'src/app/license/application/usecases/edit-license/dtos/edit-license.dto';
import { FindAllLicenseQueryDto } from 'src/app/license/application/usecases/find-all-license/dtos/find-all-license.dto';
import { LicenseModule } from 'src/app/license/license.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { LicenseController } from './license.controller';

describe('LicenseController', () => {
  let sut: LicenseController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [LicenseModule], // Import LicenseModule which imports Persistence and provides services
    })
    // Mock the guard to always allow access for controller tests
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    sut = module.get(LicenseController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createLicenseService.execute with correct values', async() => {
      // Arrange
      const input = createMock<CreateLicenseInputDto>();
      const output = createMock<CreateLicenseOutputDto>();
      // Mock the service method directly on the controller instance
      const createLicenseServiceSpy = jest.spyOn(sut['createLicenseService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createLicenseServiceSpy).toHaveBeenCalledWith(input);
      expect(result).toBe(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllLicenseService.execute with correct values', async() => {
      // Arrange
      const queries = createMock<FindAllLicenseQueryDto>();
      const output = createMock<IPagination<LicenseDto>>();
      const findAllLicenseServiceSpy = jest.spyOn(sut['findAllLicenseService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllLicenseServiceSpy).toHaveBeenCalledWith(queries);
      expect(result).toBe(output);
    });
  });

  describe('findOne', () => {
    it('should call findLicenseByIdService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-id' });
      const output = createMock<LicenseDto>();
      const findLicenseByIdServiceSpy = jest.spyOn(sut['findLicenseByIdService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findLicenseByIdServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });

  describe('update', () => {
    it('should call editLicenseService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-id' });
      const body = createMock<EditLicenseInputDto>();
      const output = createMock<SuccessMessage>();
      const editLicenseServiceSpy = jest.spyOn(sut['editLicenseService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editLicenseServiceSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toBe(output);
    });
  });

  describe('remove', () => {
    it('should call deleteLicenseService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-id' });
      const output = createMock<SuccessMessage>();
      const deleteLicenseServiceSpy = jest.spyOn(sut['deleteLicenseService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(deleteLicenseServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });
});
