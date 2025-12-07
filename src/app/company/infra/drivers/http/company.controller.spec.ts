import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { CreateCompanyInputDto, CreateCompanyOutputDto } from 'src/app/company/application/usecases/create-company/dtos/create-company.dto';
import { EditCompanyInputDto } from 'src/app/company/application/usecases/edit-company/dtos/edit-company.dto';
import { FindAllCompanyQueryDto } from 'src/app/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { CompanyModule } from 'src/app/company/company.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CompanyController } from './company.controller';

describe('CompanyController', () => {
  let sut: CompanyController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        CompanyModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CompanyController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createCompanyService with correct parameters', async() => {
      // Arrange
      const input = createMock<CreateCompanyInputDto>();
      const output = createMock<CreateCompanyOutputDto>();
      const createCompanySpy = jest.spyOn(sut['createCompanyService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createCompanySpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });

    it('should return the exact output from createCompanyService', async() => {
      // Arrange
      const input = createMock<CreateCompanyInputDto>({
        name: 'Test Company Ltd',
        fantasyName: 'Test Company',
        document: '12345678000195',
        ie: '123456789',
      });
      const expectedOutput: CreateCompanyOutputDto = { id: 'generated-company-id' };
      jest.spyOn(sut['createCompanyService'], 'execute').mockResolvedValue(expectedOutput);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(result).toBe(expectedOutput);
      expect(result.id).toBe('generated-company-id');
    });

    it('should propagate errors from createCompanyService', async() => {
      // Arrange
      const input = createMock<CreateCompanyInputDto>();
      const error = new Error('Service error');
      jest.spyOn(sut['createCompanyService'], 'execute').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.create(input)).rejects.toThrow('Service error');
    });
  });

  describe('findAll', () => {
    it('should call findAllCompanyService with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllCompanyQueryDto>();
      const output = createMock<IPagination<CompanyDto>>();
      const findAllCompanySpy = jest.spyOn(sut['findAllCompanyService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllCompanySpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });

    it('should handle empty queries object', async() => {
      // Arrange
      const queries = createMock<FindAllCompanyQueryDto>({});
      const expectedOutput = createMock<IPagination<CompanyDto>>({
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 10,
      });
      jest.spyOn(sut['findAllCompanyService'], 'execute').mockResolvedValue(expectedOutput);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(result.data).toHaveLength(0);
    });

    it('should handle queries with filters and pagination', async() => {
      // Arrange
      const queries = createMock<FindAllCompanyQueryDto>({
        name: 'Test Company',
        page: 1,
        size: 10,
      });
      const mockCompanies = [createMock<CompanyDto>()];
      const expectedOutput = createMock<IPagination<CompanyDto>>({
        data: mockCompanies,
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 10,
      });
      jest.spyOn(sut['findAllCompanyService'], 'execute').mockResolvedValue(expectedOutput);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result.data).toEqual(mockCompanies);
      expect(result.totalItems).toBe(1);
    });

    it('should propagate errors from findAllCompanyService', async() => {
      // Arrange
      const queries = createMock<FindAllCompanyQueryDto>();
      const error = new Error('Service error');
      jest.spyOn(sut['findAllCompanyService'], 'execute').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.findAll(queries)).rejects.toThrow('Service error');
    });
  });

  describe('findOne', () => {
    it('should call findCompanyByIdService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'test-company-id' });
      const output = createMock<CompanyDto>();
      const findCompanyByIdSpy = jest.spyOn(sut['findCompanyByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findCompanyByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });

    it('should return complete company data', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'existing-company-id' });
      const expectedCompany = createMock<CompanyDto>({
        id: 'existing-company-id',
        name: 'Test Company Ltd',
        fantasyName: 'Test Company',
        document: '12345678000195',
        ie: '123456789',
      });
      jest.spyOn(sut['findCompanyByIdService'], 'execute').mockResolvedValue(expectedCompany);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toBe(expectedCompany);
      expect(result.id).toBe('existing-company-id');
      expect(result.name).toBe('Test Company Ltd');
    });

    it('should propagate errors from findCompanyByIdService', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'non-existent-id' });
      const error = new Error('Company not found');
      jest.spyOn(sut['findCompanyByIdService'], 'execute').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.findOne(params)).rejects.toThrow('Company not found');
    });

    it('should extract id from params correctly', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'specific-id-123' });
      const output = createMock<CompanyDto>();
      const findCompanyByIdSpy = jest.spyOn(sut['findCompanyByIdService'], 'execute').mockResolvedValue(output);

      // Act
      await sut.findOne(params);

      // Assert
      expect(findCompanyByIdSpy).toHaveBeenCalledWith('specific-id-123');
      expect(findCompanyByIdSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should call editCompanyService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'company-to-update' });
      const body = createMock<EditCompanyInputDto>();
      const output = createMock<SuccessMessage>();
      const editCompanySpy = jest.spyOn(sut['editCompanyService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editCompanySpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });

    it('should handle partial update data', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'company-id' });
      const body = createMock<EditCompanyInputDto>({
        name: 'Updated Company Name',
        phone01: '11999888777',
      });
      const expectedOutput = createMock<SuccessMessage>({
        message: 'Empresa atualizada com sucesso!',
      });
      jest.spyOn(sut['editCompanyService'], 'execute').mockResolvedValue(expectedOutput);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toBe(expectedOutput);
      expect(result.message).toBe('Empresa atualizada com sucesso!');
    });

    it('should handle empty update body', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'company-id' });
      const body = createMock<EditCompanyInputDto>({});
      const output = createMock<SuccessMessage>();
      const editCompanySpy = jest.spyOn(sut['editCompanyService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editCompanySpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });

    it('should propagate errors from editCompanyService', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'company-id' });
      const body = createMock<EditCompanyInputDto>();
      const error = new Error('Update failed');
      jest.spyOn(sut['editCompanyService'], 'execute').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.update(params, body)).rejects.toThrow('Update failed');
    });

    it('should pass both id and body to service correctly', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'test-id-456' });
      const body = createMock<EditCompanyInputDto>({
        name: 'New Name',
        fantasyName: 'New Fantasy Name',
      });
      const output = createMock<SuccessMessage>();
      const editCompanySpy = jest.spyOn(sut['editCompanyService'], 'execute').mockResolvedValue(output);

      // Act
      await sut.update(params, body);

      // Assert
      expect(editCompanySpy).toHaveBeenCalledWith('test-id-456', body);
      expect(editCompanySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateStatus', () => {
    it('should call updateCompanyStatusService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'company-to-update-status' });
      const output = createMock<SuccessMessage>();
      const updateCompanyStatusSpy = jest.spyOn(sut['updateCompanyStatusService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(updateCompanyStatusSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });

    it('should propagate errors from updateCompanyStatusService', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'company-id' });
      const error = new Error('Status update failed');
      jest.spyOn(sut['updateCompanyStatusService'], 'execute').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.updateStatus(params)).rejects.toThrow('Status update failed');
    });

    it('should extract id from params correctly', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'specific-id-789' });
      const output = createMock<SuccessMessage>();
      const updateCompanyStatusSpy = jest.spyOn(sut['updateCompanyStatusService'], 'execute').mockResolvedValue(output);

      // Act
      await sut.updateStatus(params);

      // Assert
      expect(updateCompanyStatusSpy).toHaveBeenCalledWith('specific-id-789');
      expect(updateCompanyStatusSpy).toHaveBeenCalledTimes(1);
    });
  });
});
