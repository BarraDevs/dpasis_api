import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerDto } from '../../dtos/seller.dto';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { FindSellerById } from './find-seller-by-id.service';

describe('FindSellerById', () => {
  let sut: FindSellerById;
  let prisma: PrismaService;
  let createSeller: CreateSeller;
  let existingSellerId: string;
  let createSellerData: CreateSellerInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SellerModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindSellerById);
    prisma = module.get(PrismaService);
    createSeller = module.get(CreateSeller);

    // Clean database for integration tests
    await prisma.seller.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();

    // Create a seller for testing
    createSellerData = {
      name: 'John Doe Seller',
      nickname: 'Johnny',
      email: 'john.doe@test.com',
      phone: '1122223333',
      cellphone: '11999998888',
      commission: 10,
      zipCode: '01234567',
      street: 'Rua Teste',
      number: '123',
      complement: 'Apto 45',
      reference: 'Próximo ao metrô',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      observation: 'Vendedor experiente',
      avatarUrl: null,
      companyIds: [],
    };

    const createResult = await createSeller.execute(createSellerData);
    existingSellerId = createResult.id;
  });

  afterEach(async() => {
    await prisma.seller.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw SellerNotFoundError when seller does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const findByIdSpy = jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(SellerNotFoundError);
      expect(findByIdSpy).toHaveBeenCalledWith(nonExistentId);
    });

    it('should return seller data when seller exists', async() => {
      // Arrange
      const sellerId = 'existing-seller-id';
      const expectedSeller = createMock<SellerDto>({
        id: sellerId,
        name: 'John Doe Seller',
        nickname: 'Johnny',
        email: 'john.doe@test.com',
        phone: '1122223333',
        cellphone: '11999998888',
        commission: 10,
        zipCode: '01234567',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 45',
        reference: 'Próximo ao metrô',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        observation: 'Vendedor experiente',
        avatarUrl: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const findByIdSpy = jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(expectedSeller);

      // Act
      const result = await sut.execute(sellerId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(sellerId);
      expect(result).toEqual(expectedSeller);
    });

    it('should call sellerDao.findById with correct id', async() => {
      // Arrange
      const sellerId = 'test-seller-id';
      const mockSeller = createMock<SellerDto>({ id: sellerId });
      const findByIdSpy = jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(mockSeller);

      // Act
      await sut.execute(sellerId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(sellerId);
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should return exactly what sellerDao returns when seller exists', async() => {
      // Arrange
      const sellerId = 'test-id';
      const mockSellerData = createMock<SellerDto>({
        id: sellerId,
        name: 'Specific Seller Name',
        email: 'specific@test.com',
        commission: 15,
      });

      jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(mockSellerData);

      // Act
      const result = await sut.execute(sellerId);

      // Assert
      expect(result).toBe(mockSellerData);
    });
  });

  describe('integration tests', () => {
    it('should throw SellerNotFoundError when seller does not exist in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id-123';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(SellerNotFoundError);
    });

    it('should return complete seller data when seller exists in database', async() => {
      // Act
      const result = await sut.execute(existingSellerId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<SellerDto>({
        id: existingSellerId,
        name: createSellerData.name,
        nickname: createSellerData.nickname,
        email: createSellerData.email,
        phone: createSellerData.phone,
        cellphone: createSellerData.cellphone,
        commission: createSellerData.commission,
        zipCode: createSellerData.zipCode,
        street: createSellerData.street,
        number: createSellerData.number,
        complement: createSellerData.complement,
        reference: createSellerData.reference,
        neighborhood: createSellerData.neighborhood,
        city: createSellerData.city,
        state: createSellerData.state,
        observation: createSellerData.observation,
        avatarUrl: createSellerData.avatarUrl,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: [],
      });
    });

    it('should return different sellers for different IDs', async() => {
      // Arrange
      const secondSellerData: CreateSellerInputDto = {
        ...createSellerData,
        name: 'Jane Smith Seller',
        nickname: 'Jane',
        email: 'jane.smith@test.com',
        phone: '2133334444',
        cellphone: '21988887777',
        commission: 20,
      };

      const secondSellerResult = await createSeller.execute(secondSellerData);
      const secondSellerId = secondSellerResult.id;

      // Act
      const firstSeller = await sut.execute(existingSellerId);
      const secondSeller = await sut.execute(secondSellerId);

      // Assert
      expect(firstSeller.id).toBe(existingSellerId);
      expect(secondSeller.id).toBe(secondSellerId);
      expect(firstSeller.name).toBe(createSellerData.name);
      expect(secondSeller.name).toBe(secondSellerData.name);
      expect(firstSeller.email).toBe(createSellerData.email);
      expect(secondSeller.email).toBe(secondSellerData.email);
      expect(firstSeller.commission).toBe(createSellerData.commission);
      expect(secondSeller.commission).toBe(secondSellerData.commission);
      expect(firstSeller.id).not.toBe(secondSeller.id);
    });

    it('should handle seller with null optional fields', async() => {
      // Arrange
      const sellerWithNulls: CreateSellerInputDto = {
        ...createSellerData,
        name: 'Seller With Nulls',
        email: 'withnulls@test.com',
        phone: '3144445555',
        cellphone: '31977776666',
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
        avatarUrl: null,
      };

      const createResult = await createSeller.execute(sellerWithNulls);
      const sellerWithNullsId = createResult.id;

      // Act
      const result = await sut.execute(sellerWithNullsId);

      // Assert
      expect(result).toEqual<SellerDto>({
        id: sellerWithNullsId,
        name: sellerWithNulls.name,
        nickname: sellerWithNulls.nickname,
        email: sellerWithNulls.email,
        phone: sellerWithNulls.phone,
        cellphone: sellerWithNulls.cellphone,
        commission: sellerWithNulls.commission,
        zipCode: sellerWithNulls.zipCode,
        street: sellerWithNulls.street,
        number: sellerWithNulls.number,
        complement: sellerWithNulls.complement,
        reference: sellerWithNulls.reference,
        neighborhood: sellerWithNulls.neighborhood,
        city: sellerWithNulls.city,
        state: sellerWithNulls.state,
        observation: sellerWithNulls.observation,
        avatarUrl: sellerWithNulls.avatarUrl,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: [],
      });
    });

    it('should return consistent data on multiple calls for same ID', async() => {
      // Act
      const firstCall = await sut.execute(existingSellerId);
      const secondCall = await sut.execute(existingSellerId);

      // Assert
      expect(firstCall).toEqual(secondCall);
      expect(firstCall.id).toBe(secondCall.id);
      expect(firstCall.name).toBe(secondCall.name);
      expect(firstCall.email).toBe(secondCall.email);
      expect(firstCall.commission).toBe(secondCall.commission);
      expect(firstCall.createdAt).toEqual(secondCall.createdAt);
      expect(firstCall.updatedAt).toEqual(secondCall.updatedAt);
    });

    it('should return all seller fields correctly', async() => {
      // Act
      const result = await sut.execute(existingSellerId);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.name).toBe(createSellerData.name);
      expect(result.nickname).toBe(createSellerData.nickname);
      expect(result.email).toBe(createSellerData.email);
      expect(result.phone).toBe(createSellerData.phone);
      expect(result.cellphone).toBe(createSellerData.cellphone);
      expect(result.commission).toBe(createSellerData.commission);
      expect(result.zipCode).toBe(createSellerData.zipCode);
      expect(result.street).toBe(createSellerData.street);
      expect(result.number).toBe(createSellerData.number);
      expect(result.complement).toBe(createSellerData.complement);
      expect(result.reference).toBe(createSellerData.reference);
      expect(result.neighborhood).toBe(createSellerData.neighborhood);
      expect(result.city).toBe(createSellerData.city);
      expect(result.state).toBe(createSellerData.state);
      expect(result.observation).toBe(createSellerData.observation);
      expect(result.avatarUrl).toBe(createSellerData.avatarUrl);
      expect(result.active).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw SellerNotFoundError for empty string ID', async() => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(emptyId)).rejects.toBeInstanceOf(SellerNotFoundError);
    });

    it('should return seller with associated companies', async() => {
      // Arrange
      const company = await prisma.company.create({
        data: {
          name: 'Test Company',
          fantasyName: 'Test Co',
          document: '12345678000195',
          ie: '123456789',
          zipCode: '12345678',
          street: 'Test Street',
          number: '100',
          neighborhood: 'Test District',
          city: 'Test City',
          state: 'TS',
          phone01: '1122223333',
          email01: 'test@company.com',
          active: true,
        },
      });

      const sellerWithCompanyData: CreateSellerInputDto = {
        ...createSellerData,
        name: 'Seller With Company',
        email: 'withcompany@test.com',
        phone: '4155556666',
        cellphone: '41966665555',
        companyIds: [company.id],
      };

      const createResult = await createSeller.execute(sellerWithCompanyData);
      const sellerWithCompanyId = createResult.id;

      // Act
      const result = await sut.execute(sellerWithCompanyId);

      // Assert
      expect(result.companies).toBeDefined();
      expect(result.companies).toHaveLength(1);
      expect(result.companies[0].id).toBe(company.id);
      expect(result.companies[0].name).toBe(company.name);
    });

    it('should return inactive seller when seller is deactivated', async() => {
      // Arrange
      await prisma.seller.update({
        where: { id: existingSellerId },
        data: { active: false },
      });

      // Act
      const result = await sut.execute(existingSellerId);

      // Assert
      expect(result.id).toBe(existingSellerId);
      expect(result.active).toBe(false);
    });

    it('should handle seller with different commission values', async() => {
      // Arrange
      const commissionsToTest = [0, 5, 10, 50, 100];
      const sellerIds: string[] = [];

      for (const commission of commissionsToTest) {
        const sellerData: CreateSellerInputDto = {
          ...createSellerData,
          name: `Seller Commission ${commission}`,
          email: `commission${commission}@test.com`,
          phone: '00123456789',
          cellphone: '00123456789',
          commission,
        };
        const createResult = await createSeller.execute(sellerData);
        sellerIds.push(createResult.id);
      }

      // Act & Assert
      for (let i = 0; i < commissionsToTest.length; i++) {
        const result = await sut.execute(sellerIds[i]);
        expect(result.commission).toBe(commissionsToTest[i]);
      }
    });
  });
});
