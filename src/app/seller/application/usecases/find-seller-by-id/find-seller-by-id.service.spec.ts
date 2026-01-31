import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
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
  let createCompany: CreateCompany;
  let companyId: string;

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
    createCompany = module.get(CreateCompany);

    await prisma.truncate();

    // Create a company for seller association
    companyId = (await createCompany.execute({
      name: 'Test Company',
      fantasyName: 'TC Test',
      document: '73321315000104',
      ie: 'ie teste',
      zipCode: '12345-678',
      street: 'Test Street',
      number: '100',
      neighborhood: 'Test Neighborhood',
      complement: null,
      reference: null,
      city: 'Test City',
      state: 'TC',
      cellphone: '11912345678',
      phone01: '1112345678',
      phone02: null,
      email01: 'company@test.com',
      email02: 'company.alt@test.com',
    })).id;
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw SellerNotFoundError when seller does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(SellerNotFoundError);
      expect(sut['sellerDao'].findById).toHaveBeenCalledWith(nonExistentId);
    });

    it('should return seller data when seller exists', async() => {
      // Arrange
      const seller = createMock<SellerDto>({
        id: 'seller-id-123',
        name: 'John Seller',
        email: 'john@test.com',
        active: true,
      });
      const findByIdSpy = jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(seller);

      // Act
      const result = await sut.execute('seller-id-123');

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith('seller-id-123');
      expect(result).toBe(seller);
      expect(result.id).toBe('seller-id-123');
      expect(result.name).toBe('John Seller');
    });

    it('should call sellerDao.findById with correct id', async() => {
      // Arrange
      const testId = 'test-seller-id';
      const seller = createMock<SellerDto>();
      const findByIdSpy = jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(seller);

      // Act
      await sut.execute(testId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(findByIdSpy).toHaveBeenCalledWith(testId);
    });
  });

  describe('integration tests', () => {
    it('should throw SellerNotFoundError when seller does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(SellerNotFoundError);
    });

    it('should return correct dto when seller is found', async() => {
      // Arrange
      const sellerData: CreateSellerInputDto = {
        name: 'Jane Doe Seller',
        nickname: 'JD',
        phone: '1134567890',
        cellphone: '11987654321',
        email: 'jane.seller@test.com',
        password: 'SecurePassword123',
        commission: 15,
        zipCode: '11111-111',
        street: 'Seller Avenue',
        number: '200',
        complement: 'Suite 5',
        reference: 'Near the park',
        neighborhood: 'Downtown',
        city: 'Seller City',
        state: 'SC',
        observation: 'Excellent seller',
        companyIds: [companyId],
      };
      const createResult = await createSeller.execute(sellerData);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<SellerDto>({
        id: createResult.id,
        name: sellerData.name,
        nickname: sellerData.nickname,
        phone: sellerData.phone,
        cellphone: sellerData.cellphone,
        email: sellerData.email,
        commission: sellerData.commission,
        zipCode: sellerData.zipCode,
        street: sellerData.street,
        number: sellerData.number,
        complement: sellerData.complement,
        reference: sellerData.reference,
        neighborhood: sellerData.neighborhood,
        city: sellerData.city,
        state: sellerData.state,
        observation: sellerData.observation,
        avatarUrl: null,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: expect.arrayContaining([
          expect.objectContaining({
            id: companyId,
          }),
        ]),
      });
    });

    it('should return seller with all fields populated', async() => {
      // Arrange
      const sellerData: CreateSellerInputDto = {
        name: 'Full Data Seller',
        nickname: 'FDS',
        phone: '2133333333',
        cellphone: '21999999999',
        email: 'fulldata@test.com',
        password: 'Password123',
        commission: 20,
        zipCode: '22222-222',
        street: 'Complete Street',
        number: '300',
        complement: 'Floor 3',
        reference: 'Next to the mall',
        neighborhood: 'Full Neighborhood',
        city: 'Full City',
        state: 'FC',
        observation: 'Has all data filled',
        companyIds: [companyId],
      };
      const createResult = await createSeller.execute(sellerData);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result.name).toBe(sellerData.name);
      expect(result.nickname).toBe(sellerData.nickname);
      expect(result.phone).toBe(sellerData.phone);
      expect(result.cellphone).toBe(sellerData.cellphone);
      expect(result.email).toBe(sellerData.email);
      expect(result.commission).toBe(sellerData.commission);
      expect(result.zipCode).toBe(sellerData.zipCode);
      expect(result.street).toBe(sellerData.street);
      expect(result.number).toBe(sellerData.number);
      expect(result.complement).toBe(sellerData.complement);
      expect(result.reference).toBe(sellerData.reference);
      expect(result.neighborhood).toBe(sellerData.neighborhood);
      expect(result.city).toBe(sellerData.city);
      expect(result.state).toBe(sellerData.state);
      expect(result.observation).toBe(sellerData.observation);
    });

    it('should return seller with null optional fields', async() => {
      // Arrange
      const sellerData: CreateSellerInputDto = {
        name: 'Minimal Seller',
        nickname: null,
        phone: '(31) 4444-4444',
        cellphone: '(31) 98888-8888',
        email: 'minimal@test.com',
        password: 'Password456',
        commission: 5,
        zipCode: '33333-333',
        street: 'Minimal Street',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'Minimal Neighborhood',
        city: 'Minimal City',
        state: 'MC',
        observation: null,
        companyIds: [companyId],
      };
      const createResult = await createSeller.execute(sellerData);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result.nickname).toBeNull();
      expect(result.complement).toBeNull();
      expect(result.reference).toBeNull();
      expect(result.observation).toBeNull();
      expect(result.avatarUrl).toBeNull();
    });

    it('should return active seller by default', async() => {
      // Arrange
      const sellerData: CreateSellerInputDto = {
        name: 'Active Seller',
        nickname: null,
        phone: '(41) 5555-5555',
        cellphone: '(41) 97777-7777',
        email: 'active@test.com',
        password: 'Password789',
        commission: 12,
        zipCode: '44444-444',
        street: 'Active Street',
        number: '500',
        complement: null,
        reference: null,
        neighborhood: 'Active Neighborhood',
        city: 'Active City',
        state: 'AC',
        observation: null,
        companyIds: [companyId],
      };
      const createResult = await createSeller.execute(sellerData);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result.active).toBe(true);
    });

    it('should return seller with associated companies', async() => {
      // Arrange
      const company02Id = (await createCompany.execute({
        name: 'Second Company',
        fantasyName: 'SC Test',
        document: '52748657000135',
        ie: 'ie teste 02',
        zipCode: '54321-876',
        street: 'Second Street',
        number: '999',
        neighborhood: 'Second Neighborhood',
        complement: null,
        reference: null,
        city: 'Second City',
        state: 'SC',
        cellphone: '(21) 92222-2222',
        phone01: '(21) 2222-2222',
        phone02: null,
        email01: 'company02@test.com',
        email02: 'company02.alt@test.com',
      })).id;

      const sellerData: CreateSellerInputDto = {
        name: 'Multi Company Seller',
        nickname: null,
        phone: '(51) 6666-6666',
        cellphone: '(51) 96666-6666',
        email: 'multicompany@test.com',
        password: 'Password999',
        commission: 8,
        zipCode: '55555-555',
        street: 'Multi Street',
        number: '600',
        complement: null,
        reference: null,
        neighborhood: 'Multi Neighborhood',
        city: 'Multi City',
        state: 'MC',
        observation: null,
        companyIds: [companyId, company02Id],
      };
      const createResult = await createSeller.execute(sellerData);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result.companies).toHaveLength(2);
      expect(result.companies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: companyId }),
          expect.objectContaining({ id: company02Id }),
        ]),
      );
    });

    it('should return seller with createdAt and updatedAt timestamps', async() => {
      // Arrange
      const sellerData: CreateSellerInputDto = {
        name: 'Timestamp Seller',
        nickname: null,
        phone: '(61) 7777-7777',
        cellphone: '(61) 95555-5555',
        email: 'timestamp@test.com',
        password: 'Password111',
        commission: 10,
        zipCode: '66666-666',
        street: 'Timestamp Street',
        number: '700',
        complement: null,
        reference: null,
        neighborhood: 'Timestamp Neighborhood',
        city: 'Timestamp City',
        state: 'TC',
        observation: null,
        companyIds: [companyId],
      };
      const createResult = await createSeller.execute(sellerData);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
    });

    it('should throw error for invalid UUID format', async() => {
      // Arrange
      const invalidId = 'invalid-uuid-format';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(invalidId)).rejects.toBeInstanceOf(SellerNotFoundError);
    });

    it('should throw error for empty id', async() => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(emptyId)).rejects.toBeInstanceOf(SellerNotFoundError);
    });

    it('should return different sellers for different ids', async() => {
      // Arrange
      const seller1Data: CreateSellerInputDto = {
        name: 'First Seller',
        nickname: null,
        phone: '(71) 8888-8888',
        cellphone: '(71) 94444-4444',
        email: 'first@test.com',
        password: 'Password222',
        commission: 7,
        zipCode: '77777-777',
        street: 'First Street',
        number: '800',
        complement: null,
        reference: null,
        neighborhood: 'First Neighborhood',
        city: 'First City',
        state: 'FC',
        observation: null,
        companyIds: [companyId],
      };
      const seller2Data: CreateSellerInputDto = {
        name: 'Second Seller',
        nickname: null,
        phone: '(81) 9999-9999',
        cellphone: '(81) 93333-3333',
        email: 'second@test.com',
        password: 'Password333',
        commission: 9,
        zipCode: '88888-888',
        street: 'Second Street',
        number: '900',
        complement: null,
        reference: null,
        neighborhood: 'Second Neighborhood',
        city: 'Second City',
        state: 'SC',
        observation: null,
        companyIds: [companyId],
      };
      const seller1 = await createSeller.execute(seller1Data);
      const seller2 = await createSeller.execute(seller2Data);

      // Act
      const result1 = await sut.execute(seller1.id);
      const result2 = await sut.execute(seller2.id);

      // Assert
      expect(result1.id).toBe(seller1.id);
      expect(result2.id).toBe(seller2.id);
      expect(result1.id).not.toBe(result2.id);
      expect(result1.email).toBe('first@test.com');
      expect(result2.email).toBe('second@test.com');
    });
  });
});
