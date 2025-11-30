import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDto } from '../../dtos/company.dto';
import { CreateCompany } from '../create-company/create-company.service';
import { CreateCompanyInputDto } from '../create-company/dtos/create-company.dto';
import { FindCompanyById } from '../find-company-by-id/find-company-by-id.service';
import { EditCompanyInputDto } from './dtos/edit-company.dto';
import { EditCompany } from './edit-company.service';

describe('EditCompany', () => {
  let sut: EditCompany;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let findCompanyById: FindCompanyById;
  let existingCompanyId: string;
  let createCompanyData: CreateCompanyInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CompanyModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditCompany);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    findCompanyById = module.get(FindCompanyById);

    // Clean database for integration tests
    await prisma.company.deleteMany();

    // Create a company for testing edits
    createCompanyData = {
      name: 'Original Company Ltd',
      fantasyName: 'Original Company',
      document: '23741590000109',
      ie: '123456789',
      phone01: '11999887766',
      phone02: '1133445566',
      cellphone: '11988776655',
      email01: 'original@company.com',
      email02: 'sales@company.com',
      zipCode: '01234567',
      street: 'Rua Original',
      number: '123',
      complement: 'Sala 1',
      reference: 'Próximo ao mercado',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    };

    const createResult = await createCompany.execute(createCompanyData);
    existingCompanyId = createResult.id;
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw CompanyNotFoundError when company does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const editData: EditCompanyInputDto = {};

      const findByIdSpy = jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(nonExistentId, editData)).rejects.toBeInstanceOf(CompanyNotFoundError);
      expect(findByIdSpy).toHaveBeenCalledWith(nonExistentId);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should call companyDao.findById and companyRepository.edit with correct values', async() => {
      // Arrange
      const companyId = 'company-id-123';
      const existingCompanyData: CompanyDto = {
        id: companyId,
        name: 'Old Company Name',
        fantasyName: 'Old Fantasy',
        document: '23741590000109',
        ie: '123456789',
        zipCode: '12345678',
        street: 'Old Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Old Hood',
        city: 'Old City',
        state: 'SP',
        phone01: '1111111111',
        phone02: null,
        cellphone: null,
        email01: 'old@company.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditCompanyInputDto = {
        name: 'New Company Name',
      };

      const findByIdSpy = jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompanyData);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(companyId, editData);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(companyId);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id: companyId,
          name: editData.name,
        }),
      }));
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should merge existing data with new data when editing', async() => {
      // Arrange
      const companyId = 'company-id-456';
      const existingCompanyData: CompanyDto = {
        id: companyId,
        name: 'Existing Name',
        fantasyName: 'Existing Fantasy',
        document: '23741590000109',
        ie: '111111111',
        zipCode: '11111111',
        street: 'Existing Street',
        number: '200',
        complement: 'Apt 1',
        reference: 'Near park',
        neighborhood: 'Existing Hood',
        city: 'Existing City',
        state: 'RJ',
        phone01: '2222222222',
        phone02: '3333333333',
        cellphone: '4444444444',
        email01: 'existing@company.com',
        email02: 'contact@company.com',
        active: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const editData: EditCompanyInputDto = {
        fantasyName: 'Updated Fantasy',
        street: 'Updated Street',
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompanyData);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(companyId, editData);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id: companyId,
          name: 'Existing Name', // Preserved
          fantasyName: 'Updated Fantasy', // Updated
          street: 'Updated Street', // Updated
          city: 'Existing City', // Preserved
        }),
      }));
    });

    it('should throw CompanyDuplicateDocumentError when trying to change to existing document', async() => {
      // Arrange
      const companyId = 'company-id-789';
      const existingCompanyData: CompanyDto = {
        id: companyId,
        name: 'Company A',
        fantasyName: 'Company A',
        document: '23741590000109',
        ie: '222222222',
        zipCode: '22222222',
        street: 'Street A',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Hood A',
        city: 'City A',
        state: 'SP',
        phone01: '5555555555',
        phone02: null,
        cellphone: null,
        email01: 'companya@test.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditCompanyInputDto = {
        document: '67.942.043/0001-67', // Document of another company
      };

      const duplicateCompany: CompanyDto = {
        id: 'other-company-id',
        name: 'Company B',
        fantasyName: 'Company B',
        document: '67942043000167',
        ie: '333333333',
        zipCode: '33333333',
        street: 'Street B',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'Hood B',
        city: 'City B',
        state: 'RJ',
        phone01: '6666666666',
        phone02: null,
        cellphone: null,
        email01: 'companyb@test.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompanyData);
      jest.spyOn(sut['companyDao'], 'findByDocument').mockResolvedValue(duplicateCompany);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(companyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should not check for duplicate document when document is not being changed', async() => {
      // Arrange
      const companyId = 'company-id-999';
      const existingCompanyData: CompanyDto = {
        id: companyId,
        name: 'Same Document Company',
        fantasyName: 'Same Document',
        document: '23741590000109',
        ie: '444444444',
        zipCode: '44444444',
        street: 'Same Street',
        number: '500',
        complement: null,
        reference: null,
        neighborhood: 'Same Hood',
        city: 'Same City',
        state: 'MG',
        phone01: '7777777777',
        phone02: null,
        cellphone: null,
        email01: 'same@company.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditCompanyInputDto = {
        name: 'Updated Name',
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompanyData);
      const findByDocumentSpy = jest.spyOn(sut['companyDao'], 'findByDocument');
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(companyId, editData);

      // Assert
      expect(findByDocumentSpy).not.toHaveBeenCalled();
      expect(editSpy).toHaveBeenCalled();
    });

    it('should allow editing to same document (sanitized)', async() => {
      // Arrange
      const companyId = 'company-id-111';
      const existingCompanyData: CompanyDto = {
        id: companyId,
        name: 'Sanitized Company',
        fantasyName: 'Sanitized',
        document: '23741590000109',
        ie: '555555555',
        zipCode: '55555555',
        street: 'Sanitized Street',
        number: '600',
        complement: null,
        reference: null,
        neighborhood: 'Sanitized Hood',
        city: 'Sanitized City',
        state: 'PR',
        phone01: '8888888888',
        phone02: null,
        cellphone: null,
        email01: 'sanitized@company.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditCompanyInputDto = {
        document: '23.741.590/0001-09', // Same document but with formatting
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompanyData);
      const findByDocumentSpy = jest.spyOn(sut['companyDao'], 'findByDocument');
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(companyId, editData);

      // Assert
      expect(findByDocumentSpy).not.toHaveBeenCalled(); // Because sanitized document is same as existing
      expect(editSpy).toHaveBeenCalled();
    });

    it('should sanitize phone numbers and emails through Company entity', async() => {
      // Arrange
      const companyId = 'company-id-222';
      const existingCompanyData: CompanyDto = {
        id: companyId,
        name: 'Sanitize Test Company',
        fantasyName: 'Sanitize Test',
        document: '23741590000109',
        ie: '666666666',
        zipCode: '66666666',
        street: 'Test Street',
        number: '700',
        complement: null,
        reference: null,
        neighborhood: 'Test Hood',
        city: 'Test City',
        state: 'RS',
        phone01: '9999999999',
        phone02: null,
        cellphone: null,
        email01: 'test@company.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditCompanyInputDto = {
        phone01: '(11) 1111-2222',
        phone02: '(11) 3333-4444',
        cellphone: '(11) 98888-7777',
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompanyData);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(companyId, editData);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          phone01: '1111112222',
          phone02: '1133334444',
          cellphone: '11988887777',
        }),
      }));
    });
  });

  describe('integration tests', () => {
    it('should throw CompanyNotFoundError when company does not exist in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id-123';
      const editData: EditCompanyInputDto = { name: 'New Name' };

      // Act & Assert
      await expect(sut.execute(nonExistentId, editData)).rejects.toThrow(CompanyNotFoundError);
    });

    it('should successfully edit company name', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        name: 'Updated Company Name Ltd',
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.name).toBe('Updated Company Name Ltd');
      expect(updatedCompany.fantasyName).toBe(createCompanyData.fantasyName); // Unchanged
    });

    it('should successfully edit multiple fields', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        name: 'Multi Edit Company Ltd',
        fantasyName: 'Multi Edit',
        street: 'Rua Nova',
        number: '999',
        city: 'Rio de Janeiro',
        state: 'RJ',
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.name).toBe('Multi Edit Company Ltd');
      expect(updatedCompany.fantasyName).toBe('Multi Edit');
      expect(updatedCompany.street).toBe('Rua Nova');
      expect(updatedCompany.number).toBe('999');
      expect(updatedCompany.city).toBe('Rio de Janeiro');
      expect(updatedCompany.state).toBe('RJ');
      expect(updatedCompany.document).toBe(createCompanyData.document); // Unchanged
      expect(updatedCompany.ie).toBe(createCompanyData.ie); // Unchanged
    });

    it('should update updatedAt timestamp when editing', async() => {
      // Arrange
      const initialCompany = await findCompanyById.execute(existingCompanyId);
      const initialUpdatedAt = initialCompany.updatedAt.getTime();

      await new Promise(resolve => setTimeout(resolve, 10));

      const editData: EditCompanyInputDto = {
        fantasyName: 'Updated Fantasy Name',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt);
      expect(updatedCompany.createdAt).toEqual(initialCompany.createdAt); // createdAt unchanged
    });

    it('should preserve createdAt timestamp when editing', async() => {
      // Arrange
      const initialCompany = await findCompanyById.execute(existingCompanyId);
      const initialCreatedAt = initialCompany.createdAt;

      const editData: EditCompanyInputDto = {
        name: 'CreatedAt Test Company',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.createdAt).toEqual(initialCreatedAt);
    });

    it('should sanitize document when editing', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        document: '67.942.043/0001-67', // With formatting
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.document).toBe('67942043000167'); // Sanitized (no formatting)
    });

    it('should sanitize phone numbers when editing', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        phone01: '(21) 1111-2222',
        phone02: '(21) 3333-4444',
        cellphone: '(21) 98888-7777',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.phone01).toBe('2111112222');
      expect(updatedCompany.phone02).toBe('2133334444');
      expect(updatedCompany.cellphone).toBe('21988887777');
    });

    it('should allow setting optional fields to null', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        complement: null,
        reference: null,
        phone02: null,
        cellphone: null,
        email02: null,
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.complement).toBeNull();
      expect(updatedCompany.reference).toBeNull();
      expect(updatedCompany.phone02).toBeNull();
      expect(updatedCompany.cellphone).toBeNull();
      expect(updatedCompany.email02).toBeNull();
    });

    it('should throw CompanyDuplicateDocumentError when changing to existing document', async() => {
      // Arrange
      const secondCompanyResult = await createCompany.execute({
        name: 'Second Company Ltd',
        fantasyName: 'Second Company',
        document: '67942043000167',
        ie: '987654321',
        zipCode: '87654321',
        street: 'Second Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Uptown',
        city: 'Rio de Janeiro',
        state: 'RJ',
        phone01: '2144445555',
        phone02: null,
        cellphone: null,
        email01: 'second@company.com',
        email02: null,
      });

      const secondCompany = await findCompanyById.execute(secondCompanyResult.id);

      const editData: EditCompanyInputDto = {
        document: secondCompany.document, // Try to use second company's document
      };

      // Act & Assert
      await expect(sut.execute(existingCompanyId, editData)).rejects.toThrow(CompanyDuplicateDocumentError);

      // Verify first company's document was not changed
      const unchangedCompany = await findCompanyById.execute(existingCompanyId);
      expect(unchangedCompany.document).toBe(createCompanyData.document);
    });

    it('should allow editing company with same document (formatted differently)', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        document: '23.741.590/0001-09', // Same document with formatting
        name: 'Same Document Test',
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.document).toBe('23741590000109');
      expect(updatedCompany.name).toBe('Same Document Test');
    });

    it('should edit all fields at once', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        name: 'Complete Edit Company Ltd',
        fantasyName: 'Complete Edit',
        document: '67942043000167',
        ie: '999888777',
        zipCode: '99999999',
        street: 'Completely New Street',
        number: '1000',
        complement: 'New Suite 10',
        reference: 'New Reference Point',
        neighborhood: 'New Neighborhood',
        city: 'Brasília',
        state: 'DF',
        phone01: '6133332222',
        phone02: '6144443333',
        cellphone: '61999998888',
        email01: 'complete@newemail.com',
        email02: 'sales@newemail.com',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.id).toBe(existingCompanyId); // ID unchanged
      expect(updatedCompany.name).toBe('Complete Edit Company Ltd');
      expect(updatedCompany.fantasyName).toBe('Complete Edit');
      expect(updatedCompany.document).toBe('67942043000167');
      expect(updatedCompany.ie).toBe('999888777');
      expect(updatedCompany.zipCode).toBe('99999999');
      expect(updatedCompany.street).toBe('Completely New Street');
      expect(updatedCompany.number).toBe('1000');
      expect(updatedCompany.complement).toBe('New Suite 10');
      expect(updatedCompany.reference).toBe('New Reference Point');
      expect(updatedCompany.neighborhood).toBe('New Neighborhood');
      expect(updatedCompany.city).toBe('Brasília');
      expect(updatedCompany.state).toBe('DF');
      expect(updatedCompany.phone01).toBe('6133332222');
      expect(updatedCompany.phone02).toBe('6144443333');
      expect(updatedCompany.cellphone).toBe('61999998888');
      expect(updatedCompany.email01).toBe('complete@newemail.com');
      expect(updatedCompany.email02).toBe('sales@newemail.com');
      expect(updatedCompany.active).toBe(true); // active unchanged
    });

    it('should handle multiple edits to same company', async() => {
      // Arrange & Act - First edit
      await sut.execute(existingCompanyId, { name: 'First Edit' });
      const firstEdit = await findCompanyById.execute(existingCompanyId);

      // Second edit
      await sut.execute(existingCompanyId, { fantasyName: 'Second Edit Fantasy' });
      const secondEdit = await findCompanyById.execute(existingCompanyId);

      // Third edit
      await sut.execute(existingCompanyId, { city: 'Third Edit City' });
      const thirdEdit = await findCompanyById.execute(existingCompanyId);

      // Assert
      expect(firstEdit.name).toBe('First Edit');
      expect(secondEdit.name).toBe('First Edit'); // Preserved from first edit
      expect(secondEdit.fantasyName).toBe('Second Edit Fantasy');
      expect(thirdEdit.name).toBe('First Edit'); // Still preserved
      expect(thirdEdit.fantasyName).toBe('Second Edit Fantasy'); // Still preserved
      expect(thirdEdit.city).toBe('Third Edit City');
      expect(thirdEdit.updatedAt.getTime()).toBeGreaterThan(secondEdit.updatedAt.getTime());
    });

    it('should preserve active status when editing', async() => {
      // Arrange
      const initialCompany = await findCompanyById.execute(existingCompanyId);
      const editData: EditCompanyInputDto = {
        name: 'Active Status Test',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.active).toBe(initialCompany.active);
    });

    it('should validate email format when editing', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        email01: 'invalid-email', // Invalid email format
      };

      // Act & Assert
      await expect(sut.execute(existingCompanyId, editData)).rejects.toThrow();
    });

    it('should validate document (CNPJ) when editing', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        document: '00.000.000/0000-00', // Invalid CNPJ
      };

      // Act & Assert
      await expect(sut.execute(existingCompanyId, editData)).rejects.toThrow();
    });

    it('should validate phone number when editing', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        phone01: '123', // Invalid phone (too short)
      };

      // Act & Assert
      await expect(sut.execute(existingCompanyId, editData)).rejects.toThrow();
    });

    it('should edit only provided fields and keep others unchanged', async() => {
      // Arrange
      const initialCompany = await findCompanyById.execute(existingCompanyId);
      const editData: EditCompanyInputDto = {
        fantasyName: 'Only Fantasy Changed',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await findCompanyById.execute(existingCompanyId);
      expect(updatedCompany.fantasyName).toBe('Only Fantasy Changed');
      expect(updatedCompany.name).toBe(initialCompany.name);
      expect(updatedCompany.document).toBe(initialCompany.document);
      expect(updatedCompany.ie).toBe(initialCompany.ie);
      expect(updatedCompany.street).toBe(initialCompany.street);
      expect(updatedCompany.city).toBe(initialCompany.city);
      expect(updatedCompany.phone01).toBe(initialCompany.phone01);
      expect(updatedCompany.email01).toBe(initialCompany.email01);
    });
  });
});
