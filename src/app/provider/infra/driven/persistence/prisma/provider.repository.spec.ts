import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { ProviderPersistenceModule } from 'src/app/provider/application/persistence/provider-persistence.module';
import { Provider } from 'src/app/provider/domain/entities/provider.entity';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderRepositoryAdapterPrisma } from './provider.repository';

describe('ProviderRepositoryAdapterPrisma', () => {
  let sut: ProviderRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProviderPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ProviderRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ProviderRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.provider.deleteMany();
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
    await prisma.provider.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findById', () => {
    it('should return a provider when found', async() => {
      // Arrange
      const provider = Provider.create({
        name: 'Test Provider',
        type: ProviderType.RECURRING,
        valueInCents: 10000,
        cnpj: '38703778000130',
        ie: '123456789',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'Test Company',
        zipCode: '12345678',
        street: 'Test Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        email: 'test@email.com',
        website: null,
        companyIds: [company.id],
      });

      await sut.save(provider);

      // Act
      const foundProvider = await sut.findById(provider.props.id);

      // Assert
      expect(foundProvider).toBeDefined();
      expect(foundProvider?.props.id).toBe(provider.props.id);
      expect(foundProvider?.props.cnpj).toBe(provider.props.cnpj);
      expect(foundProvider?.props.companyIds).toEqual([company.id]);
    });

    it('should return null when provider is not found', async() => {
      // Act
      const foundProvider = await sut.findById('non-existent-id');

      // Assert
      expect(foundProvider).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a provider with RECURRING type', async() => {
      // Arrange
      const provider = Provider.create({
        name: 'Recurring Provider',
        type: ProviderType.RECURRING,
        valueInCents: 10000,
        cnpj: '38703778000130',
        ie: '123456789',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'Test Company',
        zipCode: '12345678',
        street: 'Test Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        email: 'test@email.com',
        website: 'https://test.com',
        companyIds: [company.id],
      });

      // Act
      await sut.save(provider);

      // Assert
      const savedProvider = await prisma.provider.findUnique({
        where: { id: provider.props.id },
        include: { companies: true },
      });

      expect(savedProvider).toBeDefined();
      expect(savedProvider?.id).toBe(provider.props.id);
      expect(savedProvider?.type).toBe(ProviderType.RECURRING);
      expect(savedProvider?.paymentDay).toBe(15);
      expect(savedProvider?.paymentExpirationDate).toBeNull();
      expect(savedProvider?.companies).toHaveLength(1);
    });

    it('should save a provider with ONE_TIME type', async() => {
      // Arrange
      const expirationDate = new Date('2025-12-31');
      const provider = Provider.create({
        name: 'One Time Provider',
        type: ProviderType.ONE_TIME,
        valueInCents: 20000,
        cnpj: '38703778000130',
        ie: '987654321',
        paymentDay: null,
        paymentExpirationDate: expirationDate,
        companyName: 'Test Company',
        zipCode: '12345678',
        street: 'Test Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        email: 'onetime@email.com',
        website: null,
        companyIds: [company.id],
      });

      // Act
      await sut.save(provider);

      // Assert
      const savedProvider = await prisma.provider.findUnique({
        where: { id: provider.props.id },
      });

      expect(savedProvider).toBeDefined();
      expect(savedProvider?.type).toBe(ProviderType.ONE_TIME);
      expect(savedProvider?.paymentDay).toBeNull();
      expect(savedProvider?.paymentExpirationDate).toEqual(expirationDate);
    });

    it('should throw error when trying to save provider with duplicate cnpj', async() => {
      // Arrange
      const duplicateCnpj = '94184428000185';
      const provider1 = Provider.create({
        name: 'First Provider',
        type: ProviderType.RECURRING,
        valueInCents: 10000,
        cnpj: duplicateCnpj,
        ie: '111111111',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'First Company',
        zipCode: '12345678',
        street: 'First Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'First Neighborhood',
        city: 'First City',
        state: 'FC',
        email: 'first@email.com',
        website: null,
        companyIds: [company.id],
      });

      const provider2 = Provider.create({
        name: 'Second Provider',
        type: ProviderType.RECURRING,
        valueInCents: 20000,
        cnpj: duplicateCnpj,
        ie: '222222222',
        paymentDay: 20,
        paymentExpirationDate: null,
        companyName: 'Second Company',
        zipCode: '87654321',
        street: 'Second Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Second Neighborhood',
        city: 'Second City',
        state: 'SC',
        email: 'second@email.com',
        website: null,
        companyIds: [company.id],
      });

      // Act & Assert
      await sut.save(provider1);
      await expect(sut.save(provider2)).rejects.toThrow();
    });
  });

  describe('edit', () => {
    it('should update provider properties', async() => {
      // Arrange
      const originalProvider = Provider.create({
        name: 'Original Provider',
        type: ProviderType.RECURRING,
        valueInCents: 10000,
        cnpj: '64897265000117',
        ie: '123456789',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'Original Company',
        zipCode: '12345678',
        street: 'Original Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Original Neighborhood',
        city: 'Original City',
        state: 'OC',
        email: 'original@email.com',
        website: null,
        companyIds: [company.id],
      });

      await sut.save(originalProvider);

      const updatedProvider = Provider.load({
        ...originalProvider.props,
        name: 'Updated Provider',
        valueInCents: 20000,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProvider);

      // Assert
      const editedProvider = await prisma.provider.findUnique({
        where: { id: originalProvider.props.id },
      });

      expect(editedProvider).toBeDefined();
      expect(editedProvider?.name).toBe('Updated Provider');
      expect(editedProvider?.valueInCents).toBe(20000);
    });

    it('should update provider type from RECURRING to ONE_TIME', async() => {
      // Arrange
      const provider = Provider.create({
        name: 'Type Change Provider',
        type: ProviderType.RECURRING,
        valueInCents: 10000,
        cnpj: '03532146000176',
        ie: '123456789',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'Test Company',
        zipCode: '12345678',
        street: 'Test Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        email: 'test@email.com',
        website: null,
        companyIds: [company.id],
      });

      await sut.save(provider);

      const expirationDate = new Date('2025-12-31');
      const updatedProvider = Provider.load({
        ...provider.props,
        type: ProviderType.ONE_TIME,
        paymentDay: null,
        paymentExpirationDate: expirationDate,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProvider);

      // Assert
      const editedProvider = await prisma.provider.findUnique({
        where: { id: provider.props.id },
      });

      expect(editedProvider?.type).toBe(ProviderType.ONE_TIME);
      expect(editedProvider?.paymentDay).toBeNull();
      expect(editedProvider?.paymentExpirationDate).toEqual(expirationDate);
    });

    it('should update provider type from ONE_TIME to RECURRING', async() => {
      // Arrange
      const provider = Provider.create({
        name: 'Type Change Provider',
        type: ProviderType.ONE_TIME,
        valueInCents: 10000,
        cnpj: '03532146000176',
        ie: '123456789',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'Test Company',
        zipCode: '12345678',
        street: 'Test Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        email: 'test@email.com',
        website: null,
        companyIds: [company.id],
      });

      await sut.save(provider);

      const updatedProvider = Provider.load({
        ...provider.props,
        type: ProviderType.RECURRING,
        paymentDay: 15,
        paymentExpirationDate: null,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedProvider);

      // Assert
      const editedProvider = await prisma.provider.findUnique({
        where: { id: provider.props.id },
      });

      expect(editedProvider?.type).toBe(ProviderType.RECURRING);
      expect(editedProvider?.paymentDay).toBe(15);
      expect(editedProvider?.paymentExpirationDate).toBeNull();
      expect(editedProvider?.paymentExpirationDate).toEqual(null);
    });

    it('should update provider status', async() => {
      // Arrange
      const provider = Provider.create({
        name: 'Status Provider',
        type: ProviderType.RECURRING,
        valueInCents: 10000,
        cnpj: '01377398000142',
        ie: '123456789',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'Test Company',
        zipCode: '12345678',
        street: 'Test Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        email: 'test@email.com',
        website: null,
        companyIds: [company.id],
      });

      await sut.save(provider);

      provider.toggleStatus();

      // Act
      await sut.edit(provider);

      // Assert
      const editedProvider = await prisma.provider.findUnique({
        where: { id: provider.props.id },
      });

      expect(editedProvider?.active).toBe(false);
    });

    it('should throw error when trying to edit non-existent provider', async() => {
      // Arrange
      const nonExistentProvider = Provider.load({
        id: 'non-existent-id',
        name: 'Non Existent',
        type: ProviderType.RECURRING,
        valueInCents: 10000,
        cnpj: '03532146000176',
        ie: '123456789',
        paymentDay: 15,
        paymentExpirationDate: null,
        companyName: 'Test Company',
        zipCode: '12345678',
        street: 'Test Street',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TC',
        email: 'test@email.com',
        website: null,
        active: true,
        companyIds: [company.id],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(nonExistentProvider)).rejects.toThrow();
    });
  });
});
