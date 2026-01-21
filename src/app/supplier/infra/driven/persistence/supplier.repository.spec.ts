import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPersistenceModule } from 'src/app/supplier/application/persistence/supplier-persistence.module';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierRepositoryAdapterPrisma } from './supplier.repository';

describe('SupplierRepositoryAdapterPrisma (Integration)', () => {
  let sut: SupplierRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let companyId1: string;
  let companyId2: string;

  const supplierProps = {
    cnpj: '73.229.161/0001-25',
    ie: '123.456.789.012',
    group: 'Test Group',
    type: 'Test Type',
    companyName: 'Repository Test Supplier Ltda',
    fantasyName: 'Repo Test Supplier',
    representative: 'John Doe',
    active: true,
    companyIds: [] as string[],
  };

  beforeAll(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        SupplierPersistenceModule,
      ],
      providers: [
        SupplierRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(SupplierRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

    // Create test companies
    const company1 = await prisma.company.create({
      data: {
        id: 'test-company-id-1',
        name: 'Test Company 1',
        fantasyName: 'Company 1',
        document: '12345678000190',
        ie: '111111111',
        zipCode: '12345678',
        street: 'Street 1',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'District 1',
        city: 'City 1',
        state: 'C1',
        phone01: '1111111111',
        phone02: null,
        cellphone: null,
        email01: 'company1@test.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const company2 = await prisma.company.create({
      data: {
        id: 'test-company-id-2',
        name: 'Test Company 2',
        fantasyName: 'Company 2',
        document: '98765432000190',
        ie: '222222222',
        zipCode: '87654321',
        street: 'Street 2',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'District 2',
        city: 'City 2',
        state: 'C2',
        phone01: '2222222222',
        phone02: null,
        cellphone: null,
        email01: 'company2@test.com',
        email02: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    companyId1 = company1.id;
    companyId2 = company2.id;

    supplierProps.companyIds = [companyId1];
  });

  afterEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should save a supplier successfully', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);

      // Act
      await sut.save(supplier);

      // Assert
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
        include: { companies: true },
      });

      expect(savedSupplier).toBeDefined();
      expect(savedSupplier?.id).toBe(supplier.props.id);
      expect(savedSupplier?.cnpj).toBe('73229161000125'); // Sanitized
      expect(savedSupplier?.ie).toBe(supplierProps.ie);
      expect(savedSupplier?.group).toBe(supplierProps.group);
      expect(savedSupplier?.type).toBe(supplierProps.type);
      expect(savedSupplier?.companyName).toBe(supplierProps.companyName);
      expect(savedSupplier?.fantasyName).toBe(supplierProps.fantasyName);
      expect(savedSupplier?.representative).toBe(supplierProps.representative);
      expect(savedSupplier?.active).toBe(true);
      expect(savedSupplier?.companies).toHaveLength(1);
      expect(savedSupplier?.companies[0].id).toBe(companyId1);

      const savedOwner = await prisma.owner.findUnique({
        where: { supplierId: supplier.props.id },
      });
      expect(savedOwner?.active).toBe(supplier.props.active);
    });

    it('should save supplier with sanitized CNPJ', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);

      // Act
      await sut.save(supplier);

      // Assert
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(savedSupplier?.cnpj).toBe('73229161000125'); // Without formatting
    });

    it('should save supplier with active as true by default', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);

      // Act
      await sut.save(supplier);

      // Assert
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(savedSupplier?.active).toBe(true);
      const savedOwner = await prisma.owner.findUnique({
        where: { supplierId: supplier.props.id },
      });
      expect(savedOwner?.active).toBe(true);
    });

    it('should save supplier with timestamps', async() => {
      // Arrange
      const beforeSave = new Date();
      const supplier = Supplier.create(supplierProps);

      // Act
      await sut.save(supplier);

      // Assert
      const afterSave = new Date();
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(savedSupplier?.createdAt).toBeDefined();
      expect(savedSupplier?.updatedAt).toBeDefined();
      expect(savedSupplier?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedSupplier?.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    it('should save supplier with multiple companies', async() => {
      // Arrange
      const supplierWithMultipleCompanies = Supplier.create({
        ...supplierProps,
        companyIds: [companyId1, companyId2],
      });

      // Act
      await sut.save(supplierWithMultipleCompanies);

      // Assert
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: supplierWithMultipleCompanies.props.id },
        include: { companies: true },
      });

      expect(savedSupplier?.companies).toHaveLength(2);
      expect(savedSupplier?.companies.map(c => c.id)).toContain(companyId1);
      expect(savedSupplier?.companies.map(c => c.id)).toContain(companyId2);
    });

    it('should create associated owner with same id', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);

      // Act
      await sut.save(supplier);

      // Assert
      const savedOwner = await prisma.owner.findUnique({
        where: { supplierId: supplier.props.id },
      });

      expect(savedOwner).toBeDefined();
      expect(savedOwner?.id).toBe(supplier.props.id);
      expect(savedOwner?.active).toBe(supplier.props.active);
    });

    it('should save all supplier properties correctly', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);

      // Act
      await sut.save(supplier);

      // Assert
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(savedSupplier?.cnpj).toBe('73229161000125');
      expect(savedSupplier?.ie).toBe('123.456.789.012');
      expect(savedSupplier?.group).toBe('Test Group');
      expect(savedSupplier?.type).toBe('Test Type');
      expect(savedSupplier?.companyName).toBe('Repository Test Supplier Ltda');
      expect(savedSupplier?.fantasyName).toBe('Repo Test Supplier');
      expect(savedSupplier?.representative).toBe('John Doe');
    });

    it('should enforce unique CNPJ constraint', async() => {
      // Arrange
      const supplier1 = Supplier.create(supplierProps);
      const supplier2 = Supplier.create(supplierProps); // Same CNPJ

      // Act
      await sut.save(supplier1);

      // Assert
      await expect(sut.save(supplier2)).rejects.toThrow();
    });
  });

  describe('edit', () => {
    it('should edit supplier successfully', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        companyName: 'Updated Supplier Ltd',
        fantasyName: 'Updated Supplier',
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(editedSupplier?.companyName).toBe('Updated Supplier Ltd');
      expect(editedSupplier?.fantasyName).toBe('Updated Supplier');
    });

    it('should update CNPJ when editing', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        cnpj: '55.967.002/0001-46',
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(editedSupplier?.cnpj).toBe('55967002000146'); // Sanitized
    });

    it('should update multiple fields when editing', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        group: 'Updated Group',
        type: 'Updated Type',
        ie: '999.888.777.666',
        representative: 'Jane Smith',
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(editedSupplier?.group).toBe('Updated Group');
      expect(editedSupplier?.type).toBe('Updated Type');
      expect(editedSupplier?.ie).toBe('999.888.777.666');
      expect(editedSupplier?.representative).toBe('Jane Smith');
      const savedOwner = await prisma.owner.findUnique({
        where: { supplierId: supplier.props.id },
      });
      expect(savedOwner?.active).toBe(updatedSupplier.props.active);
    });

    it('should update resource active when supplier status changes', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const originalSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });
      const originalOwner = await prisma.owner.findUnique({
        where: { supplierId: supplier.props.id },
      });
      expect(originalSupplier?.active).toBe(true);
      expect(originalOwner?.active).toBe(true);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        active: false,
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });
      const savedOwner = await prisma.owner.findUnique({
        where: { supplierId: supplier.props.id },
      });

      expect(editedSupplier?.active).toBe(false);
      expect(savedOwner?.active).toBe(false);
    });

    it('should preserve createdAt timestamp when editing', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });
      const originalCreatedAt = savedSupplier!.createdAt;

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        companyName: 'Updated Name',
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(editedSupplier?.createdAt).toEqual(originalCreatedAt);
    });

    it('should update company associations when editing', async() => {
      // Arrange
      const supplier = Supplier.create({
        ...supplierProps,
        companyIds: [companyId1],
      });
      await sut.save(supplier);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        companyIds: [companyId2], // Change to different company
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
        include: { companies: true },
      });

      expect(editedSupplier?.companies).toHaveLength(1);
      expect(editedSupplier?.companies[0].id).toBe(companyId2);
    });

    it('should update to multiple companies when editing', async() => {
      // Arrange
      const supplier = Supplier.create({
        ...supplierProps,
        companyIds: [companyId1],
      });
      await sut.save(supplier);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        companyIds: [companyId1, companyId2], // Add second company
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
        include: { companies: true },
      });

      expect(editedSupplier?.companies).toHaveLength(2);
      expect(editedSupplier?.companies.map(c => c.id)).toContain(companyId1);
      expect(editedSupplier?.companies.map(c => c.id)).toContain(companyId2);
    });

    it('should preserve id when editing', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const originalId = supplier.props.id;

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        companyName: 'Updated Name',
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: originalId },
      });

      expect(editedSupplier?.id).toBe(originalId);
    });

    it('should edit all fields at once', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        cnpj: '67.942.043/0001-67',
        ie: '888.777.666.555',
        group: 'Complete Group',
        type: 'Complete Type',
        companyName: 'Complete Edit Supplier Ltd',
        fantasyName: 'Complete Edit',
        representative: 'Complete Rep',
        companyIds: [companyId1, companyId2],
      });

      // Act
      await sut.edit(updatedSupplier);

      // Assert
      const editedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
        include: { companies: true },
      });

      expect(editedSupplier?.cnpj).toBe('67942043000167');
      expect(editedSupplier?.ie).toBe('888.777.666.555');
      expect(editedSupplier?.group).toBe('Complete Group');
      expect(editedSupplier?.type).toBe('Complete Type');
      expect(editedSupplier?.companyName).toBe('Complete Edit Supplier Ltd');
      expect(editedSupplier?.fantasyName).toBe('Complete Edit');
      expect(editedSupplier?.representative).toBe('Complete Rep');
      expect(editedSupplier?.companies).toHaveLength(2);
    });

    it('should handle multiple edits to same supplier', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      // First edit
      const firstEdit = Supplier.load({
        ...supplier.props,
        companyName: 'First Edit',
      });
      await sut.edit(firstEdit);

      // Second edit
      const secondEdit = Supplier.load({
        ...supplier.props,
        companyName: 'First Edit',
        fantasyName: 'Second Edit',
      });
      await sut.edit(secondEdit);

      // Third edit
      const thirdEdit = Supplier.load({
        ...supplier.props,
        companyName: 'First Edit',
        fantasyName: 'Second Edit',
        group: 'Third Edit',
      });
      await sut.edit(thirdEdit);

      // Assert
      const finalSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.props.id },
      });

      expect(finalSupplier?.companyName).toBe('First Edit');
      expect(finalSupplier?.fantasyName).toBe('Second Edit');
      expect(finalSupplier?.group).toBe('Third Edit');
    });

    it('should enforce unique CNPJ constraint when editing', async() => {
      // Arrange
      const supplier1 = Supplier.create({
        ...supplierProps,
        cnpj: '23741590000109',
      });
      await sut.save(supplier1);

      const supplier2 = Supplier.create({
        ...supplierProps,
        cnpj: '55967002000146',
      });
      await sut.save(supplier2);

      const updatedSupplier1 = Supplier.load({
        ...supplier1.props,
        cnpj: '55967002000146', // Try to use supplier2's CNPJ
      });

      // Act & Assert
      await expect(sut.edit(updatedSupplier1)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find supplier by id successfully', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      // Act
      const foundSupplier = await sut.findById(supplier.props.id);

      // Assert
      expect(foundSupplier).not.toBeNull();
      expect(foundSupplier).toBeInstanceOf(Supplier);
      expect(foundSupplier?.props.id).toBe(supplier.props.id);
      expect(foundSupplier?.props.cnpj).toBe('73229161000125');
      expect(foundSupplier?.props.companyName).toBe(supplierProps.companyName);
    });

    it('should return null when supplier not found', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const foundSupplier = await sut.findById(nonExistentId);

      // Assert
      expect(foundSupplier).toBeNull();
    });

    it('should return Supplier entity with all properties', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      // Act
      const foundSupplier = await sut.findById(supplier.props.id);

      // Assert
      expect(foundSupplier).not.toBeNull();
      expect(foundSupplier?.props.id).toBe(supplier.props.id);
      expect(foundSupplier?.props.cnpj).toBe('73229161000125');
      expect(foundSupplier?.props.ie).toBe(supplierProps.ie);
      expect(foundSupplier?.props.group).toBe(supplierProps.group);
      expect(foundSupplier?.props.type).toBe(supplierProps.type);
      expect(foundSupplier?.props.companyName).toBe(supplierProps.companyName);
      expect(foundSupplier?.props.fantasyName).toBe(supplierProps.fantasyName);
      expect(foundSupplier?.props.representative).toBe(supplierProps.representative);
      expect(foundSupplier?.props.active).toBe(true);
      expect(foundSupplier?.props.createdAt).toBeInstanceOf(Date);
      expect(foundSupplier?.props.updatedAt).toBeInstanceOf(Date);
    });

    it('should include company associations', async() => {
      // Arrange
      const supplier = Supplier.create({
        ...supplierProps,
        companyIds: [companyId1, companyId2],
      });
      await sut.save(supplier);

      // Act
      const foundSupplier = await sut.findById(supplier.props.id);

      // Assert
      expect(foundSupplier).not.toBeNull();
      expect(foundSupplier?.props.companyIds).toHaveLength(2);
      expect(foundSupplier?.props.companyIds).toContain(companyId1);
      expect(foundSupplier?.props.companyIds).toContain(companyId2);
    });

    it('should return updated supplier after edit', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const updatedSupplier = Supplier.load({
        ...supplier.props,
        companyName: 'Updated Name After Find',
      });
      await sut.edit(updatedSupplier);

      // Act
      const foundSupplier = await sut.findById(supplier.props.id);

      // Assert
      expect(foundSupplier?.props.companyName).toBe('Updated Name After Find');
    });
  });
});
