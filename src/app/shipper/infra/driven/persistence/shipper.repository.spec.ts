import { Test, TestingModule } from '@nestjs/testing';
import { ShipperPersistenceModule } from 'src/app/shipper/application/persistence/shipper-persistence.module';
import { Shipper } from 'src/app/shipper/domain/entities/shipper.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperRepositoryAdapterPrisma } from './shipper.repository';

describe('ShipperRepositoryAdapterPrisma (Integration)', () => {
  let sut: ShipperRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let companyId1: string;
  let companyId2: string;

  const shipperProps = {
    companyName: 'Repository Test Shipper Ltda',
    fantasyName: 'Repo Test Shipper',
    cnpj: '73.229.161/0001-25',
    contact: 'John Doe',
    representative: 'Jane Smith',
    zipCode: '12345-678',
    street: 'Test Street',
    number: '123',
    complement: 'Suite 100',
    reference: 'Near the mall',
    neighborhood: 'Downtown',
    city: 'Test City',
    state: 'TS',
    companyIds: [] as string[],
  };

  beforeAll(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        ShipperPersistenceModule,
      ],
      providers: [
        ShipperRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ShipperRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.shipper.deleteMany();
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

    shipperProps.companyIds = [companyId1];
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should save a shipper successfully', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);

      // Act
      await sut.save(shipper);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
        include: { companies: true },
      });

      expect(savedShipper).toBeDefined();
      expect(savedShipper?.id).toBe(shipper.props.id);
      expect(savedShipper?.cnpj).toBe('73229161000125'); // Sanitized
      expect(savedShipper?.companyName).toBe(shipperProps.companyName);
      expect(savedShipper?.fantasyName).toBe(shipperProps.fantasyName);
      expect(savedShipper?.contact).toBe(shipperProps.contact);
      expect(savedShipper?.representative).toBe(shipperProps.representative);
      expect(savedShipper?.zipCode).toBe(shipperProps.zipCode);
      expect(savedShipper?.street).toBe(shipperProps.street);
      expect(savedShipper?.number).toBe(shipperProps.number);
      expect(savedShipper?.complement).toBe(shipperProps.complement);
      expect(savedShipper?.reference).toBe(shipperProps.reference);
      expect(savedShipper?.neighborhood).toBe(shipperProps.neighborhood);
      expect(savedShipper?.city).toBe(shipperProps.city);
      expect(savedShipper?.state).toBe(shipperProps.state);
      expect(savedShipper?.active).toBe(true);
      expect(savedShipper?.companies).toHaveLength(1);
      expect(savedShipper?.companies[0].id).toBe(companyId1);
    });

    it('should save shipper with sanitized CNPJ', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);

      // Act
      await sut.save(shipper);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(savedShipper?.cnpj).toBe('73229161000125'); // Without formatting
    });

    it('should save shipper with active as true by default', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);

      // Act
      await sut.save(shipper);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(savedShipper?.active).toBe(true);
    });

    it('should save shipper with timestamps', async() => {
      // Arrange
      const beforeSave = new Date();
      const shipper = Shipper.create(shipperProps);

      // Act
      await sut.save(shipper);

      // Assert
      const afterSave = new Date();
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(savedShipper?.createdAt).toBeDefined();
      expect(savedShipper?.updatedAt).toBeDefined();
      expect(savedShipper?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedShipper?.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    it('should save shipper with multiple companies', async() => {
      // Arrange
      const shipperWithMultipleCompanies = Shipper.create({
        ...shipperProps,
        companyIds: [companyId1, companyId2],
      });

      // Act
      await sut.save(shipperWithMultipleCompanies);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipperWithMultipleCompanies.props.id },
        include: { companies: true },
      });

      expect(savedShipper?.companies).toHaveLength(2);
      expect(savedShipper?.companies.map(c => c.id)).toContain(companyId1);
      expect(savedShipper?.companies.map(c => c.id)).toContain(companyId2);
    });

    it('should save shipper with null complement and reference', async() => {
      // Arrange
      const shipperWithNulls = Shipper.create({
        ...shipperProps,
        complement: null,
        reference: null,
      });

      // Act
      await sut.save(shipperWithNulls);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipperWithNulls.props.id },
      });

      expect(savedShipper?.complement).toBeNull();
      expect(savedShipper?.reference).toBeNull();
    });

    it('should save all shipper properties correctly', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);

      // Act
      await sut.save(shipper);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(savedShipper?.cnpj).toBe('73229161000125');
      expect(savedShipper?.companyName).toBe('Repository Test Shipper Ltda');
      expect(savedShipper?.fantasyName).toBe('Repo Test Shipper');
      expect(savedShipper?.contact).toBe('John Doe');
      expect(savedShipper?.representative).toBe('Jane Smith');
      expect(savedShipper?.zipCode).toBe('12345-678');
      expect(savedShipper?.street).toBe('Test Street');
      expect(savedShipper?.number).toBe('123');
      expect(savedShipper?.neighborhood).toBe('Downtown');
      expect(savedShipper?.city).toBe('Test City');
      expect(savedShipper?.state).toBe('TS');
    });

    it('should enforce unique CNPJ constraint', async() => {
      // Arrange
      const shipper1 = Shipper.create(shipperProps);
      const shipper2 = Shipper.create(shipperProps); // Same CNPJ

      // Act
      await sut.save(shipper1);

      // Assert
      await expect(sut.save(shipper2)).rejects.toThrow();
    });

    it('should save shipper with no companies', async() => {
      // Arrange
      const shipperWithNoCompanies = Shipper.create({
        ...shipperProps,
        companyIds: [],
      });

      // Act
      await sut.save(shipperWithNoCompanies);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipperWithNoCompanies.props.id },
        include: { companies: true },
      });

      expect(savedShipper?.companies).toHaveLength(0);
    });
  });

  describe('edit', () => {
    it('should edit shipper successfully', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyName: 'Updated Shipper Ltd',
        fantasyName: 'Updated Shipper',
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(editedShipper?.companyName).toBe('Updated Shipper Ltd');
      expect(editedShipper?.fantasyName).toBe('Updated Shipper');
    });

    it('should update CNPJ when editing', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        cnpj: '55.967.002/0001-46',
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(editedShipper?.cnpj).toBe('55967002000146'); // Sanitized
    });

    it('should update multiple fields when editing', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        contact: 'Updated Contact',
        representative: 'Updated Representative',
        city: 'Updated City',
        state: 'UC',
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(editedShipper?.contact).toBe('Updated Contact');
      expect(editedShipper?.representative).toBe('Updated Representative');
      expect(editedShipper?.city).toBe('Updated City');
      expect(editedShipper?.state).toBe('UC');
    });

    it('should preserve createdAt timestamp when editing', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const savedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });
      const originalCreatedAt = savedShipper!.createdAt;

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyName: 'Updated Name',
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(editedShipper?.createdAt).toEqual(originalCreatedAt);
    });

    it('should update company associations when editing', async() => {
      // Arrange
      const shipper = Shipper.create({
        ...shipperProps,
        companyIds: [companyId1],
      });
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyIds: [companyId2], // Change to different company
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
        include: { companies: true },
      });

      expect(editedShipper?.companies).toHaveLength(1);
      expect(editedShipper?.companies[0].id).toBe(companyId2);
    });

    it('should update to multiple companies when editing', async() => {
      // Arrange
      const shipper = Shipper.create({
        ...shipperProps,
        companyIds: [companyId1],
      });
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyIds: [companyId1, companyId2], // Add second company
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
        include: { companies: true },
      });

      expect(editedShipper?.companies).toHaveLength(2);
      expect(editedShipper?.companies.map(c => c.id)).toContain(companyId1);
      expect(editedShipper?.companies.map(c => c.id)).toContain(companyId2);
    });

    it('should update to no companies when editing', async() => {
      // Arrange
      const shipper = Shipper.create({
        ...shipperProps,
        companyIds: [companyId1, companyId2],
      });
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyIds: [], // Remove all companies
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
        include: { companies: true },
      });

      expect(editedShipper?.companies).toHaveLength(0);
    });

    it('should preserve id when editing', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const originalId = shipper.props.id;

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyName: 'Updated Name',
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: originalId },
      });

      expect(editedShipper?.id).toBe(originalId);
    });

    it('should update address fields when editing', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        zipCode: '98765-432',
        street: 'New Street',
        number: '456',
        complement: 'Floor 2',
        reference: 'Behind the station',
        neighborhood: 'New Neighborhood',
        city: 'New City',
        state: 'NC',
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(editedShipper?.zipCode).toBe('98765-432');
      expect(editedShipper?.street).toBe('New Street');
      expect(editedShipper?.number).toBe('456');
      expect(editedShipper?.complement).toBe('Floor 2');
      expect(editedShipper?.reference).toBe('Behind the station');
      expect(editedShipper?.neighborhood).toBe('New Neighborhood');
      expect(editedShipper?.city).toBe('New City');
      expect(editedShipper?.state).toBe('NC');
    });

    it('should update complement and reference to null when editing', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        complement: null,
        reference: null,
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(editedShipper?.complement).toBeNull();
      expect(editedShipper?.reference).toBeNull();
    });

    it('should edit all fields at once', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyName: 'Complete Edit Shipper Ltd',
        fantasyName: 'Complete Edit',
        cnpj: '67.942.043/0001-67',
        contact: 'Complete Contact',
        representative: 'Complete Rep',
        zipCode: '00000-000',
        street: 'Complete Street',
        number: '999',
        complement: 'Complete Complement',
        reference: 'Complete Reference',
        neighborhood: 'Complete Neighborhood',
        city: 'Complete City',
        state: 'CC',
        companyIds: [companyId1, companyId2],
      });

      // Act
      await sut.edit(updatedShipper);

      // Assert
      const editedShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
        include: { companies: true },
      });

      expect(editedShipper?.companyName).toBe('Complete Edit Shipper Ltd');
      expect(editedShipper?.fantasyName).toBe('Complete Edit');
      expect(editedShipper?.cnpj).toBe('67942043000167');
      expect(editedShipper?.contact).toBe('Complete Contact');
      expect(editedShipper?.representative).toBe('Complete Rep');
      expect(editedShipper?.zipCode).toBe('00000-000');
      expect(editedShipper?.street).toBe('Complete Street');
      expect(editedShipper?.number).toBe('999');
      expect(editedShipper?.complement).toBe('Complete Complement');
      expect(editedShipper?.reference).toBe('Complete Reference');
      expect(editedShipper?.neighborhood).toBe('Complete Neighborhood');
      expect(editedShipper?.city).toBe('Complete City');
      expect(editedShipper?.state).toBe('CC');
      expect(editedShipper?.companies).toHaveLength(2);
    });

    it('should handle multiple edits to same shipper', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      // First edit
      const firstEdit = Shipper.load({
        ...shipper.props,
        companyName: 'First Edit',
      });
      await sut.edit(firstEdit);

      // Second edit
      const secondEdit = Shipper.load({
        ...shipper.props,
        companyName: 'First Edit',
        fantasyName: 'Second Edit',
      });
      await sut.edit(secondEdit);

      // Third edit
      const thirdEdit = Shipper.load({
        ...shipper.props,
        companyName: 'First Edit',
        fantasyName: 'Second Edit',
        city: 'Third Edit',
      });
      await sut.edit(thirdEdit);

      // Assert
      const finalShipper = await prisma.shipper.findUnique({
        where: { id: shipper.props.id },
      });

      expect(finalShipper?.companyName).toBe('First Edit');
      expect(finalShipper?.fantasyName).toBe('Second Edit');
      expect(finalShipper?.city).toBe('Third Edit');
    });

    it('should enforce unique CNPJ constraint when editing', async() => {
      // Arrange
      const shipper1 = Shipper.create({
        ...shipperProps,
        cnpj: '23741590000109',
      });
      await sut.save(shipper1);

      const shipper2 = Shipper.create({
        ...shipperProps,
        cnpj: '55967002000146',
      });
      await sut.save(shipper2);

      const updatedShipper1 = Shipper.load({
        ...shipper1.props,
        cnpj: '55967002000146', // Try to use shipper2's CNPJ
      });

      // Act & Assert
      await expect(sut.edit(updatedShipper1)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find shipper by id successfully', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      // Act
      const foundShipper = await sut.findById(shipper.props.id);

      // Assert
      expect(foundShipper).not.toBeNull();
      expect(foundShipper).toBeInstanceOf(Shipper);
      expect(foundShipper?.props.id).toBe(shipper.props.id);
      expect(foundShipper?.props.cnpj).toBe('73229161000125');
      expect(foundShipper?.props.companyName).toBe(shipperProps.companyName);
    });

    it('should return null when shipper not found', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const foundShipper = await sut.findById(nonExistentId);

      // Assert
      expect(foundShipper).toBeNull();
    });

    it('should return Shipper entity with all properties', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      // Act
      const foundShipper = await sut.findById(shipper.props.id);

      // Assert
      expect(foundShipper).not.toBeNull();
      expect(foundShipper?.props.id).toBe(shipper.props.id);
      expect(foundShipper?.props.cnpj).toBe('73229161000125');
      expect(foundShipper?.props.companyName).toBe(shipperProps.companyName);
      expect(foundShipper?.props.fantasyName).toBe(shipperProps.fantasyName);
      expect(foundShipper?.props.contact).toBe(shipperProps.contact);
      expect(foundShipper?.props.representative).toBe(shipperProps.representative);
      expect(foundShipper?.props.zipCode).toBe(shipperProps.zipCode);
      expect(foundShipper?.props.street).toBe(shipperProps.street);
      expect(foundShipper?.props.number).toBe(shipperProps.number);
      expect(foundShipper?.props.complement).toBe(shipperProps.complement);
      expect(foundShipper?.props.reference).toBe(shipperProps.reference);
      expect(foundShipper?.props.neighborhood).toBe(shipperProps.neighborhood);
      expect(foundShipper?.props.city).toBe(shipperProps.city);
      expect(foundShipper?.props.state).toBe(shipperProps.state);
      expect(foundShipper?.props.active).toBe(true);
      expect(foundShipper?.props.createdAt).toBeInstanceOf(Date);
      expect(foundShipper?.props.updatedAt).toBeInstanceOf(Date);
    });

    it('should include company associations', async() => {
      // Arrange
      const shipper = Shipper.create({
        ...shipperProps,
        companyIds: [companyId1, companyId2],
      });
      await sut.save(shipper);

      // Act
      const foundShipper = await sut.findById(shipper.props.id);

      // Assert
      expect(foundShipper).not.toBeNull();
      expect(foundShipper?.props.companyIds).toHaveLength(2);
      expect(foundShipper?.props.companyIds).toContain(companyId1);
      expect(foundShipper?.props.companyIds).toContain(companyId2);
    });

    it('should return shipper with no companies', async() => {
      // Arrange
      const shipper = Shipper.create({
        ...shipperProps,
        companyIds: [],
      });
      await sut.save(shipper);

      // Act
      const foundShipper = await sut.findById(shipper.props.id);

      // Assert
      expect(foundShipper).not.toBeNull();
      expect(foundShipper?.props.companyIds).toHaveLength(0);
    });

    it('should return updated shipper after edit', async() => {
      // Arrange
      const shipper = Shipper.create(shipperProps);
      await sut.save(shipper);

      const updatedShipper = Shipper.load({
        ...shipper.props,
        companyName: 'Updated Name After Find',
      });
      await sut.edit(updatedShipper);

      // Act
      const foundShipper = await sut.findById(shipper.props.id);

      // Assert
      expect(foundShipper?.props.companyName).toBe('Updated Name After Find');
    });

    it('should return shipper with null complement and reference', async() => {
      // Arrange
      const shipper = Shipper.create({
        ...shipperProps,
        complement: null,
        reference: null,
      });
      await sut.save(shipper);

      // Act
      const foundShipper = await sut.findById(shipper.props.id);

      // Assert
      expect(foundShipper).not.toBeNull();
      expect(foundShipper?.props.complement).toBeNull();
      expect(foundShipper?.props.reference).toBeNull();
    });
  });
});
