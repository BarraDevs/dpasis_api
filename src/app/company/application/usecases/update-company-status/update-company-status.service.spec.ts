import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateCompany } from '../create-company/create-company.service';
import { FindCompanyById } from '../find-company-by-id/find-company-by-id.service';
import { UpdateCompanyStatus } from './update-company-status.service';

describe('UpdateCompanyStatus', () => {
  let sut: UpdateCompanyStatus;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let findCompanyById: FindCompanyById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CompanyModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(UpdateCompanyStatus);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    findCompanyById = module.get(FindCompanyById);

    await prisma.company.deleteMany();
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw CompanyNotFoundError if company does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const findByIdSpy = jest.spyOn(sut['companyRepository'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit');

      // Act & Assert
      expect.assertions(3);
      return sut.execute(id).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith(id);
        expect(editSpy).not.toHaveBeenCalled();
      });
    });

    it('should call companyRepository.findById and companyRepository.edit with correct values', async() => {
      // Arrange
      const id = 'company-id-123';
      const companyEntity = Company.load({
        id,
        name: 'Test Company Ltd',
        fantasyName: 'Test Company',
        document: '67942043000167',
        ie: '123456789',
        zipCode: '12345678',
        street: 'Main Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Downtown',
        city: 'São Paulo',
        state: 'SP',
        phone01: '1133334444',
        phone02: null,
        cellphone: null,
        email01: 'test@company.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const findByIdSpy = jest.spyOn(sut['companyRepository'], 'findById').mockResolvedValue(companyEntity);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id,
          active: false, // Should be toggled
        }),
      }));
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });
    });

    it('should toggle status from active to inactive', async() => {
      // Arrange
      const id = 'company-id-123';
      const companyEntity = Company.load({
        id,
        name: 'Active Company Ltd',
        fantasyName: 'Active Company',
        document: '67942043000167',
        ie: '222333444',
        zipCode: '11111222',
        street: 'Active Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Center',
        city: 'Rio de Janeiro',
        state: 'RJ',
        phone01: '2144445555',
        phone02: null,
        cellphone: null,
        email01: 'active@company.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['companyRepository'], 'findById').mockResolvedValue(companyEntity);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: false,
        }),
      }));
    });

    it('should toggle status from inactive to active', async() => {
      // Arrange
      const id = 'company-id-123';
      const companyEntity = Company.load({
        id,
        name: 'Inactive Company Ltd',
        fantasyName: 'Inactive Company',
        document: '67942043000167',
        ie: '333444555',
        zipCode: '22222333',
        street: 'Inactive Street',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'North',
        city: 'Belo Horizonte',
        state: 'MG',
        phone01: '3155556666',
        phone02: null,
        cellphone: null,
        email01: 'inactive@company.com',
        email02: null,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['companyRepository'], 'findById').mockResolvedValue(companyEntity);
      const editSpy = jest.spyOn(sut['companyRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: true,
        }),
      }));
    });
  });

  describe('integration tests', () => {
    it('should throw CompanyNotFoundError if company does not exist', async() => {
      // Arrange
      const id = 'non-existing-company-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(CompanyNotFoundError);
    });

    it('should toggle company status from active to inactive', async() => {
      // Arrange
      const company = await createCompany.execute({
        name: 'Test Company Ltd',
        fantasyName: 'Test Company',
        document: '67942043000167',
        ie: '111222333444',
        zipCode: '12345678',
        street: 'Main Street',
        number: '100',
        complement: 'Suite 1',
        reference: 'Near the mall',
        neighborhood: 'Downtown',
        city: 'São Paulo',
        state: 'SP',
        phone01: '1133334444',
        phone02: '1155556666',
        cellphone: '11999998888',
        email01: 'test@company.com',
        email02: 'sales@company.com',
      });

      // Verify initial status is active
      const initialCompany = await findCompanyById.execute(company.id);
      expect(initialCompany).not.toBeNull();
      expect(initialCompany.active).toBe(true);

      // Act
      const result = await sut.execute(company.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const updatedCompany = await findCompanyById.execute(company.id);
      expect(updatedCompany).not.toBeNull();
      expect(updatedCompany.active).toBe(false);
      expect(updatedCompany.updatedAt.getTime()).toBeGreaterThan(initialCompany.updatedAt.getTime());
    });

    it('should toggle company status from inactive to active', async() => {
      // Arrange
      const company = await createCompany.execute({
        name: 'Inactive Company Ltd',
        fantasyName: 'Inactive Company',
        document: '01427316000127',
        ie: '222333444555',
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
        email01: 'inactive@company.com',
        email02: null,
      });

      // First toggle to inactive
      await sut.execute(company.id);
      const inactiveCompany = await findCompanyById.execute(company.id);
      expect(inactiveCompany).not.toBeNull();
      expect(inactiveCompany.active).toBe(false);

      // Act - Toggle back to active
      const result = await sut.execute(company.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const activeCompany = await findCompanyById.execute(company.id);
      expect(activeCompany).not.toBeNull();
      expect(activeCompany.active).toBe(true);
      expect(activeCompany.updatedAt.getTime()).toBeGreaterThan(inactiveCompany.updatedAt.getTime());
    });

    it('should toggle status multiple times correctly', async() => {
      // Arrange
      const company = await createCompany.execute({
        name: 'Multiple Toggle Company Ltd',
        fantasyName: 'Multiple Toggle',
        document: '52435131000103',
        ie: '333444555666',
        zipCode: '11111222',
        street: 'Toggle Street',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Center',
        city: 'Belo Horizonte',
        state: 'MG',
        phone01: '3155556666',
        phone02: null,
        cellphone: null,
        email01: 'toggle@company.com',
        email02: null,
      });

      // Act & Assert - Toggle 1: active -> inactive
      await sut.execute(company.id);
      let currentCompany = await findCompanyById.execute(company.id);
      expect(currentCompany).not.toBeNull();
      expect(currentCompany.active).toBe(false);

      // Toggle 2: inactive -> active
      await sut.execute(company.id);
      currentCompany = await findCompanyById.execute(company.id);
      expect(currentCompany).not.toBeNull();
      expect(currentCompany.active).toBe(true);

      // Toggle 3: active -> inactive
      await sut.execute(company.id);
      currentCompany = await findCompanyById.execute(company.id);
      expect(currentCompany).not.toBeNull();
      expect(currentCompany.active).toBe(false);

      // Toggle 4: inactive -> active
      await sut.execute(company.id);
      currentCompany = await findCompanyById.execute(company.id);
      expect(currentCompany).not.toBeNull();
      expect(currentCompany.active).toBe(true);
    });

    it('should update updatedAt timestamp on status toggle', async() => {
      // Arrange
      const company = await createCompany.execute({
        name: 'Timestamp Test Company Ltd',
        fantasyName: 'Timestamp Test',
        document: '20021261000103',
        ie: '444555666777',
        zipCode: '22222333',
        street: 'Timestamp Street',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'South',
        city: 'Curitiba',
        state: 'PR',
        phone01: '4166667777',
        phone02: null,
        cellphone: null,
        email01: 'timestamp@company.com',
        email02: null,
      });

      const beforeToggle = await findCompanyById.execute(company.id);
      expect(beforeToggle).not.toBeNull();
      const initialUpdatedAt = beforeToggle.updatedAt.getTime();

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await sut.execute(company.id);

      // Assert
      const afterToggle = await findCompanyById.execute(company.id);
      expect(afterToggle).not.toBeNull();
      expect(afterToggle.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt);
    });

    it('should preserve all other company properties when toggling status', async() => {
      // Arrange
      const originalData = {
        name: 'Preserve Props Company Ltd',
        fantasyName: 'Preserve Props',
        document: '75279173000190',
        ie: '555666777888',
        zipCode: '33333444',
        street: 'Preserve Street',
        number: '500',
        complement: 'Suite 5',
        reference: 'Near the park',
        neighborhood: 'West',
        city: 'Porto Alegre',
        state: 'RS',
        phone01: '5177778888',
        phone02: '5166665555',
        cellphone: '51999887766',
        email01: 'preserve@company.com',
        email02: 'contact@company.com',
      };

      const company = await createCompany.execute(originalData);
      const initialCompany = await findCompanyById.execute(company.id);
      expect(initialCompany).not.toBeNull();

      // Act
      await sut.execute(company.id);

      // Assert
      const toggledCompany = await findCompanyById.execute(company.id);
      expect(toggledCompany).not.toBeNull();
      expect(toggledCompany.name).toBe(originalData.name);
      expect(toggledCompany.fantasyName).toBe(originalData.fantasyName);
      expect(toggledCompany.document).toBe(originalData.document);
      expect(toggledCompany.ie).toBe(originalData.ie);
      expect(toggledCompany.zipCode).toBe(originalData.zipCode);
      expect(toggledCompany.street).toBe(originalData.street);
      expect(toggledCompany.number).toBe(originalData.number);
      expect(toggledCompany.complement).toBe(originalData.complement);
      expect(toggledCompany.reference).toBe(originalData.reference);
      expect(toggledCompany.neighborhood).toBe(originalData.neighborhood);
      expect(toggledCompany.city).toBe(originalData.city);
      expect(toggledCompany.state).toBe(originalData.state);
      expect(toggledCompany.phone01).toBe(originalData.phone01);
      expect(toggledCompany.phone02).toBe(originalData.phone02);
      expect(toggledCompany.cellphone).toBe(originalData.cellphone);
      expect(toggledCompany.email01).toBe(originalData.email01);
      expect(toggledCompany.email02).toBe(originalData.email02);
      expect(toggledCompany.createdAt).toEqual(initialCompany.createdAt);
      // Only active and updatedAt should change
      expect(toggledCompany.active).not.toBe(initialCompany.active);
    });

    it('should work with companies that have null optional fields', async() => {
      // Arrange
      const company = await createCompany.execute({
        name: 'Minimal Company Ltd',
        fantasyName: 'Minimal',
        document: '45077596000166',
        ie: '666777888999',
        zipCode: '44444555',
        street: 'Minimal Street',
        number: '600',
        complement: null,
        reference: null,
        neighborhood: 'East',
        city: 'Recife',
        state: 'PE',
        phone01: '8188889999',
        phone02: null,
        cellphone: null,
        email01: 'minimal@company.com',
        email02: null,
      });

      const initialCompany = await findCompanyById.execute(company.id);
      expect(initialCompany).not.toBeNull();
      expect(initialCompany.complement).toBeNull();
      expect(initialCompany.reference).toBeNull();
      expect(initialCompany.phone02).toBeNull();
      expect(initialCompany.cellphone).toBeNull();
      expect(initialCompany.email02).toBeNull();

      // Act
      await sut.execute(company.id);

      // Assert
      const toggledCompany = await findCompanyById.execute(company.id);
      expect(toggledCompany).not.toBeNull();
      expect(toggledCompany.active).toBe(false);
      expect(toggledCompany.complement).toBeNull();
      expect(toggledCompany.reference).toBeNull();
      expect(toggledCompany.phone02).toBeNull();
      expect(toggledCompany.cellphone).toBeNull();
      expect(toggledCompany.email02).toBeNull();
    });

    it('should return success message with correct text', async() => {
      // Arrange
      const company = await createCompany.execute({
        name: 'Message Test Company Ltd',
        fantasyName: 'Message Test',
        document: '12911198000144',
        ie: '777888999111',
        zipCode: '55555666',
        street: 'Message Street',
        number: '700',
        complement: null,
        reference: null,
        neighborhood: 'North',
        city: 'Salvador',
        state: 'BA',
        phone01: '7199990000',
        phone02: null,
        cellphone: null,
        email01: 'message@company.com',
        email02: null,
      });

      // Act
      const result = await sut.execute(company.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Status atualizado com sucesso.',
      });
      expect(result.message).toBe('Status atualizado com sucesso.');
    });
  });
});
