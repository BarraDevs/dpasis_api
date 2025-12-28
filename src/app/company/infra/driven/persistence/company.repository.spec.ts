import { Test, TestingModule } from '@nestjs/testing';
import { CompanyPersistenceModule } from 'src/app/company/application/persistence/company-persistence.module';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyRepositoryAdapterPrisma } from './company.repository';

describe('CompanyRepositoryAdapterPrisma (Integration)', () => {
  let sut: CompanyRepositoryAdapterPrisma;
  let prisma: PrismaService;

  const companyProps = {
    name: 'Repository Test Company Ltda',
    fantasyName: 'Repo Test Company',
    document: '73.229.161/0001-25',
    ie: '123.456.789.012',
    zipCode: '12345-678',
    street: 'Test Street',
    number: '100',
    complement: 'Building A',
    reference: 'Near the park',
    neighborhood: 'Test District',
    city: 'Test City',
    state: 'TS',
    phone01: '(11) 1111-2222',
    phone02: '(11) 3333-4444',
    cellphone: '(11) 99999-8888',
    email01: 'test@company.com',
    email02: 'contact@company.com',
  };

  beforeAll(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        CompanyPersistenceModule,
      ],
      providers: [
        CompanyRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(CompanyRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.company.deleteMany();
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('findById', () => {
    it('should return a company when found by id', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      // Act
      const foundCompany = await sut.findById(company.props.id);

      // Assert
      expect(foundCompany).toBeDefined();
      expect(foundCompany).toBeInstanceOf(Company);
      expect(foundCompany?.props.id).toBe(company.props.id);
      expect(foundCompany?.props.name).toBe(companyProps.name);
      expect(foundCompany?.props.fantasyName).toBe(companyProps.fantasyName);
      expect(foundCompany?.props.document).toBe(company.props.document);
      expect(foundCompany?.props.ie).toBe(companyProps.ie);
      expect(foundCompany?.props.zipCode).toBe(companyProps.zipCode);
      expect(foundCompany?.props.street).toBe(companyProps.street);
      expect(foundCompany?.props.number).toBe(companyProps.number);
      expect(foundCompany?.props.complement).toBe(companyProps.complement);
      expect(foundCompany?.props.reference).toBe(companyProps.reference);
      expect(foundCompany?.props.neighborhood).toBe(companyProps.neighborhood);
      expect(foundCompany?.props.city).toBe(companyProps.city);
      expect(foundCompany?.props.state).toBe(companyProps.state);
      expect(foundCompany?.props.phone01).toBe(company.props.phone01);
      expect(foundCompany?.props.phone02).toBe(company.props.phone02);
      expect(foundCompany?.props.cellphone).toBe(company.props.cellphone);
      expect(foundCompany?.props.email01).toBe(companyProps.email01);
      expect(foundCompany?.props.email02).toBe(companyProps.email02);
      expect(foundCompany?.props.active).toBe(true);
      expect(foundCompany?.props.createdAt).toBeInstanceOf(Date);
      expect(foundCompany?.props.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null when company is not found by id', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id-12345';

      // Act
      const foundCompany = await sut.findById(nonExistentId);

      // Assert
      expect(foundCompany).toBeNull();
    });

    it('should return the correct company when multiple companies exist', async() => {
      // Arrange
      const company1 = Company.create(companyProps);
      const company2 = Company.create({
        ...companyProps,
        name: 'Second Company Ltda',
        document: '45.926.939/0001-10',
        ie: '111222333444',
        email01: 'second@company.com',
      });
      const company3 = Company.create({
        ...companyProps,
        name: 'Third Company Ltda',
        document: '10.249.823/0001-09',
        ie: '999888777666',
        email01: 'third@company.com',
      });

      await sut.save(company1);
      await sut.save(company2);
      await sut.save(company3);

      // Act
      const foundCompany = await sut.findById(company2.props.id);

      // Assert
      expect(foundCompany).toBeDefined();
      expect(foundCompany?.props.id).toBe(company2.props.id);
      expect(foundCompany?.props.name).toBe('Second Company Ltda');
      expect(foundCompany?.props.document).toBe(company2.props.document);
    });

    it('should return company with null optional fields', async() => {
      // Arrange
      const company = Company.create({
        ...companyProps,
        complement: null,
        reference: null,
        phone02: null,
        cellphone: null,
        email02: null,
      });
      await sut.save(company);

      // Act
      const foundCompany = await sut.findById(company.props.id);

      // Assert
      expect(foundCompany).toBeDefined();
      expect(foundCompany?.props.complement).toBeNull();
      expect(foundCompany?.props.reference).toBeNull();
      expect(foundCompany?.props.phone02).toBeNull();
      expect(foundCompany?.props.cellphone).toBeNull();
      expect(foundCompany?.props.email02).toBeNull();
    });

    it('should return inactive company when searching by id', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const inactiveCompany = Company.load({
        ...company.props,
        active: false,
        updatedAt: new Date(),
      });
      await sut.edit(inactiveCompany);

      // Act
      const foundCompany = await sut.findById(company.props.id);

      // Assert
      expect(foundCompany).toBeDefined();
      expect(foundCompany?.props.active).toBe(false);
    });

    it('should return Company instance with correct entity structure', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      // Act
      const foundCompany = await sut.findById(company.props.id);

      // Assert
      expect(foundCompany).toBeInstanceOf(Company);
      expect(foundCompany?.props).toBeDefined();
      expect(typeof foundCompany?.props.id).toBe('string');
      expect(typeof foundCompany?.props.name).toBe('string');
      expect(typeof foundCompany?.props.active).toBe('boolean');
      expect(foundCompany?.props.createdAt).toBeInstanceOf(Date);
      expect(foundCompany?.props.updatedAt).toBeInstanceOf(Date);
    });

    it('should return updated data after company edit', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const editedCompany = Company.load({
        ...company.props,
        name: 'Updated Company Name',
        fantasyName: 'Updated Fantasy Name',
        updatedAt: new Date(),
      });
      await sut.edit(editedCompany);

      // Act
      const foundCompany = await sut.findById(company.props.id);

      // Assert
      expect(foundCompany).toBeDefined();
      expect(foundCompany?.props.name).toBe('Updated Company Name');
      expect(foundCompany?.props.fantasyName).toBe('Updated Fantasy Name');
      expect(foundCompany?.props.updatedAt.getTime()).toBeGreaterThan(company.props.createdAt.getTime());
    });

    it('should handle UUID format validation implicitly', async() => {
      // Arrange
      const invalidIds = [
        '',
        '   ',
        'invalid-uuid',
        '12345',
        'abc-def-ghi',
      ];

      // Act & Assert
      for (const invalidId of invalidIds) {
        const foundCompany = await sut.findById(invalidId);
        expect(foundCompany).toBeNull();
      }
    });

    it('should return null after company is saved and then database is cleared', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);
      const companyId = company.props.id;

      // Clear database
      await prisma.company.deleteMany();

      // Act
      const foundCompany = await sut.findById(companyId);

      // Assert
      expect(foundCompany).toBeNull();
    });

    it('should consistently return same data on multiple findById calls', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      // Act
      const foundCompany1 = await sut.findById(company.props.id);
      const foundCompany2 = await sut.findById(company.props.id);
      const foundCompany3 = await sut.findById(company.props.id);

      // Assert
      expect(foundCompany1?.props.id).toBe(foundCompany2?.props.id);
      expect(foundCompany2?.props.id).toBe(foundCompany3?.props.id);
      expect(foundCompany1?.props.name).toBe(foundCompany2?.props.name);
      expect(foundCompany2?.props.name).toBe(foundCompany3?.props.name);
    });
  });

  describe('save', () => {
    it('should save a company successfully', async() => {
      // Arrange
      const company = Company.create(companyProps);

      // Act
      await sut.save(company);

      // Assert
      const savedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(savedCompany).toBeDefined();
      expect(savedCompany?.id).toBe(company.props.id);
      expect(savedCompany?.name).toBe(companyProps.name);
      expect(savedCompany?.fantasyName).toBe(companyProps.fantasyName);
      expect(savedCompany?.document).toBe('73229161000125'); // Sanitized
      expect(savedCompany?.ie).toBe(companyProps.ie);
      expect(savedCompany?.zipCode).toBe(companyProps.zipCode);
      expect(savedCompany?.street).toBe(companyProps.street);
      expect(savedCompany?.number).toBe(companyProps.number);
      expect(savedCompany?.complement).toBe(companyProps.complement);
      expect(savedCompany?.reference).toBe(companyProps.reference);
      expect(savedCompany?.neighborhood).toBe(companyProps.neighborhood);
      expect(savedCompany?.city).toBe(companyProps.city);
      expect(savedCompany?.state).toBe(companyProps.state);
      expect(savedCompany?.phone01).toBe('1111112222'); // Sanitized
      expect(savedCompany?.phone02).toBe('1133334444'); // Sanitized
      expect(savedCompany?.cellphone).toBe('11999998888'); // Sanitized
      expect(savedCompany?.email01).toBe(companyProps.email01);
      expect(savedCompany?.email02).toBe(companyProps.email02);
      expect(savedCompany?.active).toBe(true);
      expect(savedCompany?.createdAt).toBeInstanceOf(Date);
      expect(savedCompany?.updatedAt).toBeInstanceOf(Date);
    });

    it('should save company with null optional fields', async() => {
      // Arrange
      const company = Company.create({
        ...companyProps,
        complement: null,
        reference: null,
        phone02: null,
        cellphone: null,
        email02: null,
      });

      // Act
      await sut.save(company);

      // Assert
      const savedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(savedCompany).toBeDefined();
      expect(savedCompany?.complement).toBeNull();
      expect(savedCompany?.reference).toBeNull();
      expect(savedCompany?.phone02).toBeNull();
      expect(savedCompany?.cellphone).toBeNull();
      expect(savedCompany?.email02).toBeNull();
    });

    it('should save multiple companies with unique documents', async() => {
      // Arrange
      const company1 = Company.create(companyProps);
      const company2 = Company.create({
        ...companyProps,
        name: 'Another Company Ltda',
        document: '45.926.939/0001-10',
        ie: '111222333444',
      });

      // Act
      await sut.save(company1);
      await sut.save(company2);

      // Assert
      const savedCompanies = await prisma.company.findMany();
      expect(savedCompanies).toHaveLength(2);

      const saved1 = savedCompanies.find(c => c.id === company1.props.id);
      const saved2 = savedCompanies.find(c => c.id === company2.props.id);

      expect(saved1).toBeDefined();
      expect(saved2).toBeDefined();
      expect(saved1?.name).toBe(companyProps.name);
      expect(saved2?.name).toBe('Another Company Ltda');
    });

    it('should throw error when trying to save company with duplicate id', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      // Act & Assert
      await expect(sut.save(company)).rejects.toThrow();
    });

    it('should throw error when trying to save company with duplicate document', async() => {
      // Arrange
      const company1 = Company.create(companyProps);
      const company2 = Company.create({ ...companyProps, ie: '999888777666' });
      await sut.save(company1);

      // Act & Assert
      await expect(sut.save(company2)).rejects.toThrow();
    });

    it('should save company with all timestamps set correctly', async() => {
      // Arrange
      const beforeCreate = new Date();
      const company = Company.create(companyProps);
      const afterCreate = new Date();

      // Act
      await sut.save(company);

      // Assert
      const savedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(savedCompany?.createdAt).toBeInstanceOf(Date);
      expect(savedCompany?.updatedAt).toBeInstanceOf(Date);
      expect(savedCompany?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(savedCompany?.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('edit', () => {
    it('should update company data successfully', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const editedCompany = Company.load({
        ...company.props,
        name: 'Updated Company Name Ltda',
        fantasyName: 'Updated Fantasy',
        street: 'Updated Street',
        number: '999',
        phone01: '1199998888',
        email01: 'updated@company.com',
      });

      // Act
      await sut.edit(editedCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany).toBeDefined();
      expect(updatedCompany?.id).toBe(company.props.id);
      expect(updatedCompany?.name).toBe('Updated Company Name Ltda');
      expect(updatedCompany?.fantasyName).toBe('Updated Fantasy');
      expect(updatedCompany?.street).toBe('Updated Street');
      expect(updatedCompany?.number).toBe('999');
      expect(updatedCompany?.phone01).toBe('1199998888');
      expect(updatedCompany?.email01).toBe('updated@company.com');
      // Unchanged fields
      expect(updatedCompany?.document).toBe(company.props.document);
      expect(updatedCompany?.ie).toBe(company.props.ie);
    });

    it('should update company status from active to inactive', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const inactiveCompany = Company.load({
        ...company.props,
        active: false,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(inactiveCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany?.active).toBe(false);
    });

    it('should update company status from inactive to active', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      // Toggle to inactive
      const inactiveCompany = Company.load({
        ...company.props,
        active: false,
        updatedAt: new Date(),
      });
      await sut.edit(inactiveCompany);

      // Toggle back to active
      const activeCompany = Company.load({
        ...inactiveCompany.props,
        active: true,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(activeCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany?.active).toBe(true);
    });

    it('should update updatedAt timestamp when editing', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const initialUpdatedAt = company.props.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

      const editedCompany = Company.load({
        ...company.props,
        name: 'Timestamp Test',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(editedCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany?.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });

    it('should update optional fields to null', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const editedCompany = Company.load({
        ...company.props,
        complement: null,
        reference: null,
        phone02: null,
        cellphone: null,
        email02: null,
      });

      // Act
      await sut.edit(editedCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany?.complement).toBeNull();
      expect(updatedCompany?.reference).toBeNull();
      expect(updatedCompany?.phone02).toBeNull();
      expect(updatedCompany?.cellphone).toBeNull();
      expect(updatedCompany?.email02).toBeNull();
    });

    it('should update null optional fields to values', async() => {
      // Arrange
      const company = Company.create({
        ...companyProps,
        complement: null,
        reference: null,
        phone02: null,
        cellphone: null,
        email02: null,
      });
      await sut.save(company);

      const editedCompany = Company.load({
        ...company.props,
        complement: 'New Building',
        reference: 'New Reference',
        phone02: '1144445555',
        cellphone: '11988887777',
        email02: 'new@company.com',
      });

      // Act
      await sut.edit(editedCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany?.complement).toBe('New Building');
      expect(updatedCompany?.reference).toBe('New Reference');
      expect(updatedCompany?.phone02).toBe('1144445555');
      expect(updatedCompany?.cellphone).toBe('11988887777');
      expect(updatedCompany?.email02).toBe('new@company.com');
    });

    it('should throw error when trying to edit non-existent company', async() => {
      // Arrange
      const nonExistentCompany = Company.load({
        id: 'non-existent-id',
        name: 'Non Existent Company',
        fantasyName: 'Non Existent',
        document: '36.990.654/0001-57',
        ie: '111111111111',
        zipCode: '00000-000',
        street: 'Non Existent Street',
        number: '0',
        complement: null,
        reference: null,
        neighborhood: 'Non Existent',
        city: 'Non Existent City',
        state: 'NE',
        phone01: '0000000000',
        phone02: null,
        cellphone: null,
        email01: 'nonexistent@company.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(nonExistentCompany)).rejects.toThrow();
    });

    it('should throw error when trying to change document to an existing one', async() => {
      // Arrange
      const company1 = Company.create(companyProps);
      const company2 = Company.create({
        ...companyProps,
        document: '10.249.823/0001-09',
        ie: '111222333444',
        email01: 'company2@test.com',
      });
      await sut.save(company1);
      await sut.save(company2);

      const editedCompany2 = Company.load({
        ...company2.props,
        document: company1.props.document,
      });

      // Act & Assert
      await expect(sut.edit(editedCompany2)).rejects.toThrow();
    });

    it('should preserve createdAt when editing', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const originalCreatedAt = company.props.createdAt;

      const editedCompany = Company.load({
        ...company.props,
        name: 'Edited Name',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(editedCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany?.createdAt).toEqual(originalCreatedAt);
    });

    it('should successfully edit company multiple times', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      // First edit
      const firstEdit = Company.load({
        ...company.props,
        name: 'First Edit',
        updatedAt: new Date(),
      });
      await sut.edit(firstEdit);

      // Second edit
      const secondEdit = Company.load({
        ...firstEdit.props,
        name: 'Second Edit',
        updatedAt: new Date(),
      });
      await sut.edit(secondEdit);

      // Third edit
      const thirdEdit = Company.load({
        ...secondEdit.props,
        name: 'Third Edit',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(thirdEdit);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany?.name).toBe('Third Edit');
    });

    it('should return all fields in correct format after edit', async() => {
      // Arrange
      const company = Company.create(companyProps);
      await sut.save(company);

      const editedCompany = Company.load({
        ...company.props,
        name: 'Fully Updated Company',
        fantasyName: 'Updated Fantasy',
        street: 'New Address Street',
        number: '777',
        complement: 'New Complement',
        reference: 'New Reference',
        neighborhood: 'New Neighborhood',
        city: 'New City',
        state: 'NC',
        phone01: '1166667777',
        phone02: '1188889999',
        cellphone: '11955554444',
        email01: 'fullupdate@company.com',
        email02: 'fullupdate2@company.com',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(editedCompany);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.props.id },
      });

      expect(updatedCompany).toBeDefined();
      expect(updatedCompany?.id).toBe(company.props.id);
      expect(updatedCompany?.name).toBe('Fully Updated Company');
      expect(updatedCompany?.fantasyName).toBe('Updated Fantasy');
      expect(updatedCompany?.document).toBe(company.props.document);
      expect(updatedCompany?.ie).toBe(company.props.ie);
      expect(updatedCompany?.zipCode).toBe(company.props.zipCode);
      expect(updatedCompany?.street).toBe('New Address Street');
      expect(updatedCompany?.number).toBe('777');
      expect(updatedCompany?.complement).toBe('New Complement');
      expect(updatedCompany?.reference).toBe('New Reference');
      expect(updatedCompany?.neighborhood).toBe('New Neighborhood');
      expect(updatedCompany?.city).toBe('New City');
      expect(updatedCompany?.state).toBe('NC');
      expect(updatedCompany?.phone01).toBe('1166667777');
      expect(updatedCompany?.phone02).toBe('1188889999');
      expect(updatedCompany?.cellphone).toBe('11955554444');
      expect(updatedCompany?.email01).toBe('fullupdate@company.com');
      expect(updatedCompany?.email02).toBe('fullupdate2@company.com');
      expect(updatedCompany?.active).toBe(true);
      expect(updatedCompany?.createdAt).toBeInstanceOf(Date);
      expect(updatedCompany?.updatedAt).toBeInstanceOf(Date);
    });
  });
});
