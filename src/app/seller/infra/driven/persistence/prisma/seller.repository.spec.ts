import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { SellerPersistenceModule } from 'src/app/seller/application/persistence/seller-persistence.module';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerRepositoryAdapterPrisma } from './seller.repository';

describe('SellerRepositoryAdapterPrisma', () => {
  let sut: SellerRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        SellerPersistenceModule,
        ConfigModule,
      ],
      providers: [
        SellerRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(SellerRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.seller.deleteMany();
    await prisma.role.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();

    company = await prisma.company.create({
      data: {
        name: 'Company Test',
        fantasyName: 'Company Test Fantasy',
        document: '11222333000181',
        ie: 'ie teste',
        zipCode: 'zipCode teste',
        street: 'street teste',
        number: 'number teste',
        neighborhood: 'neighborhood teste',
        city: 'city teste',
        state: 'state teste',
        phone01: 'phone01 teste',
        email01: 'email01 teste',
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.seller.deleteMany();
    await prisma.role.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findById', () => {
    it('should return a seller when found', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Test Seller',
        nickname: 'Tester',
        phone: '3411111111',
        cellphone: '34911111111',
        email: 'testseller@test.com',
        commission: 5.5,
        zipCode: '12345-678',
        street: 'Test Street',
        number: '100',
        complement: 'Apt 1',
        reference: 'Near park',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        observation: 'Test observation',
        avatarUrl: 'https://avatar.com/test.jpg',
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password_test');

      // Act
      const foundSeller = await sut.findById(seller.props.id);

      // Assert
      expect(foundSeller).toBeDefined();
      expect(foundSeller?.props.id).toBe(seller.props.id);
      expect(foundSeller?.props.name).toBe(seller.props.name);
      expect(foundSeller?.props.email).toBe(seller.props.email);
      expect(foundSeller?.props.companyIds).toEqual([company.id]);
    });

    it('should return null when seller is not found', async() => {
      // Act
      const foundSeller = await sut.findById('non-existent-id');

      // Assert
      expect(foundSeller).toBeNull();
    });

    it('should load seller with all properties correctly', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'John Doe',
        nickname: 'Johnny',
        phone: '1122222222',
        cellphone: '11922222222',
        email: 'john@test.com',
        commission: 7.0,
        zipCode: '98765-432',
        street: 'Main Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Downtown',
        city: 'Big City',
        state: 'BC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password');

      // Act
      const foundSeller = await sut.findById(seller.props.id);

      // Assert
      expect(foundSeller).toBeDefined();
      expect(foundSeller?.props.name).toBe('John Doe');
      expect(foundSeller?.props.nickname).toBe('Johnny');
      expect(foundSeller?.props.phone).toBe('1122222222');
      expect(foundSeller?.props.cellphone).toBe('11922222222');
      expect(foundSeller?.props.email).toBe('john@test.com');
      expect(foundSeller?.props.commission).toBe(7.0);
      expect(foundSeller?.props.zipCode).toBe('98765-432');
      expect(foundSeller?.props.street).toBe('Main Street');
      expect(foundSeller?.props.number).toBe('200');
      expect(foundSeller?.props.complement).toBeNull();
      expect(foundSeller?.props.reference).toBeNull();
      expect(foundSeller?.props.neighborhood).toBe('Downtown');
      expect(foundSeller?.props.city).toBe('Big City');
      expect(foundSeller?.props.state).toBe('BC');
      expect(foundSeller?.props.observation).toBeNull();
      expect(foundSeller?.props.avatarUrl).toBeNull();
      expect(foundSeller?.props.active).toBe(true);
    });
  });

  describe('save', () => {
    it('should save a seller with all required fields', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Save Test Seller',
        nickname: 'SaveTester',
        phone: '1144444444',
        cellphone: '11944444444',
        email: 'savetest@test.com',
        commission: 8.5,
        zipCode: '22222-222',
        street: 'Save Street',
        number: '400',
        complement: 'Suite 10',
        reference: 'Next to mall',
        neighborhood: 'Save District',
        city: 'Save City',
        state: 'SC',
        observation: 'New seller',
        avatarUrl: 'https://avatar.com/save.jpg',
        companyIds: [company.id],
      });

      // Act
      await sut.save(seller, 'hashed_password_save');

      // Assert
      const savedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
        include: {
          companies: true,
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(savedSeller).toBeDefined();
      expect(savedSeller?.id).toBe(seller.props.id);
      expect(savedSeller?.name).toBe('Save Test Seller');
      expect(savedSeller?.nickname).toBe('SaveTester');
      expect(savedSeller?.phone).toBe('1144444444');
      expect(savedSeller?.cellphone).toBe('11944444444');
      expect(savedSeller?.commission).toBe(8.5);
      expect(savedSeller?.companies).toHaveLength(1);
      expect(savedSeller?.companies[0].id).toBe(company.id);
      expect(savedSeller?.role.account.email).toBe('savetest@test.com');
      expect(savedSeller?.role.account.password).toBe('hashed_password_save');
    });

    it('should save a seller with multiple companies', async() => {
      // Arrange
      const company2 = await prisma.company.create({
        data: {
          name: 'Company 2',
          fantasyName: 'Company 2 Fantasy',
          document: '22333444000105',
          ie: 'ie teste 2',
          zipCode: 'zipCode teste 2',
          street: 'street teste 2',
          number: 'number teste 2',
          neighborhood: 'neighborhood teste 2',
          city: 'city teste 2',
          state: 'state teste 2',
          phone01: 'phone01 teste 2',
          email01: 'email01 teste 2',
          active: true,
        },
      });

      const seller = Seller.create({
        name: 'Multi Company Seller',
        nickname: 'MultiTester',
        phone: '1155555555',
        cellphone: '11955555555',
        email: 'multi@test.com',
        commission: 5.0,
        zipCode: '33333-333',
        street: 'Multi Street',
        number: '500',
        complement: null,
        reference: null,
        neighborhood: 'Multi District',
        city: 'Multi City',
        state: 'MC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id, company2.id],
      });

      // Act
      await sut.save(seller, 'hashed_password');

      // Assert
      const savedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
        include: { companies: true },
      });

      expect(savedSeller?.companies).toHaveLength(2);
      const companyIds = savedSeller?.companies.map(c => c.id).sort();
      expect(companyIds).toEqual([company.id, company2.id].sort());
    });

    it('should save seller with nullable fields as null', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Minimal Seller',
        nickname: 'Minimal',
        phone: '1166666666',
        cellphone: '11966666666',
        email: 'minimal@test.com',
        commission: 4.5,
        zipCode: '44444-444',
        street: 'Minimal Street',
        number: '600',
        complement: null,
        reference: null,
        neighborhood: 'Minimal District',
        city: 'Minimal City',
        state: 'MC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      // Act
      await sut.save(seller, 'hashed_password');

      // Assert
      const savedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
      });

      expect(savedSeller?.complement).toBeNull();
      expect(savedSeller?.reference).toBeNull();
      expect(savedSeller?.observation).toBeNull();
      expect(savedSeller?.avatarUrl).toBeNull();
    });

    it('should create account and role when saving seller', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Account Test',
        nickname: 'AccountTester',
        phone: '1177777777',
        cellphone: '11977777777',
        email: 'account@test.com',
        commission: 6.5,
        zipCode: '55555-555',
        street: 'Account Street',
        number: '700',
        complement: null,
        reference: null,
        neighborhood: 'Account District',
        city: 'Account City',
        state: 'AC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      // Act
      await sut.save(seller, 'hashed_account_password');

      // Assert
      const savedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(savedSeller?.role).toBeDefined();
      expect(savedSeller?.role.account).toBeDefined();
      expect(savedSeller?.role.account.email).toBe('account@test.com');
      expect(savedSeller?.role.account.password).toBe('hashed_account_password');
      expect(savedSeller?.role.account.status).toBe(AccountStatus.ACTIVE);
    });

    it('should throw error when trying to save seller with duplicate email', async() => {
      // Arrange
      const duplicateEmail = 'duplicate@test.com';
      const seller1 = Seller.create({
        name: 'First Seller',
        nickname: 'First',
        phone: '1188888888',
        cellphone: '11988888888',
        email: duplicateEmail,
        commission: 5.0,
        zipCode: '66666-666',
        street: 'First Street',
        number: '800',
        complement: null,
        reference: null,
        neighborhood: 'First District',
        city: 'First City',
        state: 'FC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      const seller2 = Seller.create({
        name: 'Second Seller',
        nickname: 'Second',
        phone: '1199999999',
        cellphone: '11999999999',
        email: duplicateEmail,
        commission: 6.0,
        zipCode: '77777-777',
        street: 'Second Street',
        number: '900',
        complement: null,
        reference: null,
        neighborhood: 'Second District',
        city: 'Second City',
        state: 'SC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      // Act & Assert
      await sut.save(seller1, 'password1');
      await expect(sut.save(seller2, 'password2')).rejects.toThrow();
    });
  });

  describe('edit', () => {
    it('should update seller properties', async() => {
      // Arrange
      const originalSeller = Seller.create({
        name: 'Original Name',
        nickname: 'Original',
        phone: '1112121212',
        cellphone: '11912121212',
        email: 'original@test.com',
        commission: 5.0,
        zipCode: '88888-888',
        street: 'Original Street',
        number: '1000',
        complement: 'Apt 100',
        reference: 'Reference',
        neighborhood: 'Original District',
        city: 'Original City',
        state: 'OC',
        observation: 'Original observation',
        avatarUrl: 'https://avatar.com/original.jpg',
        companyIds: [company.id],
      });

      await sut.save(originalSeller, 'hashed_password');

      const updatedSeller = Seller.load({
        ...originalSeller.props,
        name: 'Updated Name',
        nickname: 'Updated',
        phone: '2122222222',
        cellphone: '21922222222',
        commission: 8.0,
        observation: 'Updated observation',
        avatarUrl: 'https://avatar.com/updated.jpg',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedSeller);

      // Assert
      const editedSeller = await prisma.seller.findUnique({
        where: { id: originalSeller.props.id },
      });

      expect(editedSeller).toBeDefined();
      expect(editedSeller?.name).toBe('Updated Name');
      expect(editedSeller?.nickname).toBe('Updated');
      expect(editedSeller?.phone).toBe('2122222222');
      expect(editedSeller?.cellphone).toBe('21922222222');
      expect(editedSeller?.commission).toBe(8.0);
      expect(editedSeller?.observation).toBe('Updated observation');
      expect(editedSeller?.avatarUrl).toBe('https://avatar.com/updated.jpg');
    });

    it('should update seller email in account', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Email Update Test',
        nickname: 'EmailTest',
        phone: '3133333333',
        cellphone: '31933333333',
        email: 'oldemail@test.com',
        commission: 5.5,
        zipCode: '99999-999',
        street: 'Email Street',
        number: '1100',
        complement: null,
        reference: null,
        neighborhood: 'Email District',
        city: 'Email City',
        state: 'EC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password');

      const updatedSeller = Seller.load({
        ...seller.props,
        email: 'newemail@test.com',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedSeller);

      // Assert
      const editedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(editedSeller?.role.account.email).toBe('newemail@test.com');
    });

    it('should update seller companies', async() => {
      // Arrange
      const company2 = await prisma.company.create({
        data: {
          name: 'Company 2',
          fantasyName: 'Company 2 Fantasy',
          document: '22333444000105',
          ie: 'ie teste 2',
          zipCode: 'zipCode teste 2',
          street: 'street teste 2',
          number: 'number teste 2',
          neighborhood: 'neighborhood teste 2',
          city: 'city teste 2',
          state: 'state teste 2',
          phone01: 'phone01 teste 2',
          email01: 'email01 teste 2',
          active: true,
        },
      });

      const seller = Seller.create({
        name: 'Company Update Test',
        nickname: 'CompanyTest',
        phone: '4144444444',
        cellphone: '41944444444',
        email: 'companytest@test.com',
        commission: 6.0,
        zipCode: '10101-010',
        street: 'Company Street',
        number: '1200',
        complement: null,
        reference: null,
        neighborhood: 'Company District',
        city: 'Company City',
        state: 'CC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password');

      const updatedSeller = Seller.load({
        ...seller.props,
        companyIds: [company2.id],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedSeller);

      // Assert
      const editedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
        include: { companies: true },
      });

      expect(editedSeller?.companies).toHaveLength(1);
      expect(editedSeller?.companies[0].id).toBe(company2.id);
    });

    it('should update seller to have multiple companies', async() => {
      // Arrange
      const company2 = await prisma.company.create({
        data: {
          name: 'Company 2',
          fantasyName: 'Company 2 Fantasy',
          document: '22333444000105',
          ie: 'ie teste 2',
          zipCode: 'zipCode teste 2',
          street: 'street teste 2',
          number: 'number teste 2',
          neighborhood: 'neighborhood teste 2',
          city: 'city teste 2',
          state: 'state teste 2',
          phone01: 'phone01 teste 2',
          email01: 'email01 teste 2',
          active: true,
        },
      });

      const seller = Seller.create({
        name: 'Multi Company Update',
        nickname: 'MultiUpdate',
        phone: '5155555555',
        cellphone: '51955555555',
        email: 'multiupdate@test.com',
        commission: 7.0,
        zipCode: '20202-020',
        street: 'Multi Street',
        number: '1300',
        complement: null,
        reference: null,
        neighborhood: 'Multi District',
        city: 'Multi City',
        state: 'MC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password');

      const updatedSeller = Seller.load({
        ...seller.props,
        companyIds: [company.id, company2.id],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedSeller);

      // Assert
      const editedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
        include: { companies: true },
      });

      expect(editedSeller?.companies).toHaveLength(2);
      const companyIds = editedSeller?.companies.map(c => c.id).sort();
      expect(companyIds).toEqual([company.id, company2.id].sort());
    });

    it('should update seller status', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Status Test',
        nickname: 'StatusTest',
        phone: '6166666666',
        cellphone: '61966666666',
        email: 'statustest@test.com',
        commission: 5.0,
        zipCode: '30303-030',
        street: 'Status Street',
        number: '1400',
        complement: null,
        reference: null,
        neighborhood: 'Status District',
        city: 'Status City',
        state: 'SC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password');

      seller.toggleStatus();

      // Act
      await sut.edit(seller);

      // Assert
      const editedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
      });

      expect(editedSeller?.active).toBe(false);
    });

    it('should update address fields', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Address Test',
        nickname: 'AddressTest',
        phone: '7177777777',
        cellphone: '71977777777',
        email: 'addresstest@test.com',
        commission: 6.0,
        zipCode: '11111-111',
        street: 'Old Street',
        number: '100',
        complement: 'Old Apt',
        reference: 'Old Reference',
        neighborhood: 'Old District',
        city: 'Old City',
        state: 'OC',
        observation: null,
        avatarUrl: null,
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password');

      const updatedSeller = Seller.load({
        ...seller.props,
        zipCode: '22222-222',
        street: 'New Street',
        number: '200',
        complement: 'New Apt',
        reference: 'New Reference',
        neighborhood: 'New District',
        city: 'New City',
        state: 'NC',
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedSeller);

      // Assert
      const editedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
      });

      expect(editedSeller?.zipCode).toBe('22222-222');
      expect(editedSeller?.street).toBe('New Street');
      expect(editedSeller?.number).toBe('200');
      expect(editedSeller?.complement).toBe('New Apt');
      expect(editedSeller?.reference).toBe('New Reference');
      expect(editedSeller?.neighborhood).toBe('New District');
      expect(editedSeller?.city).toBe('New City');
      expect(editedSeller?.state).toBe('NC');
    });

    it('should throw error when trying to edit non-existent seller', async() => {
      // Arrange
      const nonExistentSeller = Seller.load({
        id: 'non-existent-id',
        name: 'Non Existent',
        nickname: 'NonExistent',
        phone: '8188888888',
        cellphone: '81988888888',
        email: 'nonexistent@test.com',
        commission: 5.0,
        zipCode: '40404-040',
        street: 'Non Existent Street',
        number: '1500',
        complement: null,
        reference: null,
        neighborhood: 'Non Existent District',
        city: 'Non Existent City',
        state: 'NE',
        observation: null,
        avatarUrl: null,
        active: true,
        companyIds: [company.id],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(nonExistentSeller)).rejects.toThrow();
    });

    it('should update seller with nullable fields to null', async() => {
      // Arrange
      const seller = Seller.create({
        name: 'Nullable Test',
        nickname: 'NullTest',
        phone: '9199999999',
        cellphone: '91999999999',
        email: 'nullable@test.com',
        commission: 5.5,
        zipCode: '50505-050',
        street: 'Nullable Street',
        number: '1600',
        complement: 'Some complement',
        reference: 'Some reference',
        neighborhood: 'Nullable District',
        city: 'Nullable City',
        state: 'NC',
        observation: 'Some observation',
        avatarUrl: 'https://avatar.com/nullable.jpg',
        companyIds: [company.id],
      });

      await sut.save(seller, 'hashed_password');

      const updatedSeller = Seller.load({
        ...seller.props,
        complement: null,
        reference: null,
        observation: null,
        avatarUrl: null,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedSeller);

      // Assert
      const editedSeller = await prisma.seller.findUnique({
        where: { id: seller.props.id },
      });

      expect(editedSeller?.complement).toBeNull();
      expect(editedSeller?.reference).toBeNull();
      expect(editedSeller?.observation).toBeNull();
      expect(editedSeller?.avatarUrl).toBeNull();
    });
  });
});
