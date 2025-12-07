import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { SellerDto } from '../../dtos/seller.dto';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import { FindSellerById } from './find-seller-by-id.service';

describe('FindSellerById', () => {
  let sut: FindSellerById;
  let sellerDao: ISellerDao;

  const mockSellerWithAvatar: SellerDto = {
    id: 'seller-id-123',
    name: 'John Doe',
    nickname: 'Johnny',
    phone: '1122223333',
    cellphone: '11999998888',
    email: 'john@example.com',
    commission: 10,
    zipCode: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Sala 101',
    reference: 'Próximo ao metrô',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    observation: 'Vendedor experiente',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    companies: [
      {
        id: 'company-id-1',
        name: 'Company 1',
      },
      {
        id: 'company-id-2',
        name: 'Company 2',
      },
    ],
  };

  const mockSellerWithoutAvatar: SellerDto = {
    id: 'seller-id-456',
    name: 'Jane Doe',
    nickname: null,
    phone: '1133334444',
    cellphone: '11888887777',
    email: 'jane@example.com',
    commission: 15,
    zipCode: '01310100',
    street: 'Rua Augusta',
    number: '500',
    complement: null,
    reference: null,
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    observation: null,
    avatarUrl: null,
    active: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
    companies: [],
  };

  describe('Unit Tests', () => {
    beforeEach(async() => {
      const module = await Test.createTestingModule({
        providers: [
          FindSellerById,
          {
            provide: TOKENS.SellerDao,
            useValue: createMock<ISellerDao>(),
          },
        ],
      }).compile();

      sut = module.get<FindSellerById>(FindSellerById);
      sellerDao = module.get<ISellerDao>(TOKENS.SellerDao);
    });

    it('should be defined', () => {
      expect(sut).toBeDefined();
    });

    it('should throw SellerNotFoundError when seller does not exist', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute('non-existent-id')).rejects.toThrow(SellerNotFoundError);
    });

    it('should return seller with avatar when found', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithAvatar);

      // Act
      const result = await sut.execute('seller-id-123');

      // Assert
      expect(result).toEqual(mockSellerWithAvatar);
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
      expect(sellerDao.findById).toHaveBeenCalledWith('seller-id-123');
      expect(sellerDao.findById).toHaveBeenCalledTimes(1);
    });

    it('should return seller without avatar when found', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithoutAvatar);

      // Act
      const result = await sut.execute('seller-id-456');

      // Assert
      expect(result).toEqual(mockSellerWithoutAvatar);
      expect(result.avatarUrl).toBeNull();
      expect(sellerDao.findById).toHaveBeenCalledWith('seller-id-456');
      expect(sellerDao.findById).toHaveBeenCalledTimes(1);
    });

    it('should return seller with all properties', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithAvatar);

      // Act
      const result = await sut.execute('seller-id-123');

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('nickname');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('cellphone');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('commission');
      expect(result).toHaveProperty('zipCode');
      expect(result).toHaveProperty('street');
      expect(result).toHaveProperty('number');
      expect(result).toHaveProperty('complement');
      expect(result).toHaveProperty('reference');
      expect(result).toHaveProperty('neighborhood');
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('observation');
      expect(result).toHaveProperty('avatarUrl');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('companies');
    });

    it('should return seller with companies', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithAvatar);

      // Act
      const result = await sut.execute('seller-id-123');

      // Assert
      expect(result.companies).toHaveLength(2);
      expect(result.companies[0]).toHaveProperty('id');
      expect(result.companies[0]).toHaveProperty('name');
    });

    it('should return seller with empty companies array', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithoutAvatar);

      // Act
      const result = await sut.execute('seller-id-456');

      // Assert
      expect(result.companies).toEqual([]);
      expect(result.companies).toHaveLength(0);
    });

    it('should return seller with null optional fields', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithoutAvatar);

      // Act
      const result = await sut.execute('seller-id-456');

      // Assert
      expect(result.nickname).toBeNull();
      expect(result.complement).toBeNull();
      expect(result.reference).toBeNull();
      expect(result.observation).toBeNull();
      expect(result.avatarUrl).toBeNull();
    });

    it('should return seller with filled optional fields', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithAvatar);

      // Act
      const result = await sut.execute('seller-id-123');

      // Assert
      expect(result.nickname).toBe('Johnny');
      expect(result.complement).toBe('Sala 101');
      expect(result.reference).toBe('Próximo ao metrô');
      expect(result.observation).toBe('Vendedor experiente');
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
    });

    it('should return seller with correct data types', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithAvatar);

      // Act
      const result = await sut.execute('seller-id-123');

      // Assert
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.phone).toBe('string');
      expect(typeof result.cellphone).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(typeof result.commission).toBe('number');
      expect(typeof result.active).toBe('boolean');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(result.companies)).toBe(true);
    });

    it('should call sellerDao.findById with correct id', async() => {
      // Arrange
      const sellerId = 'specific-seller-id';
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerWithAvatar);

      // Act
      await sut.execute(sellerId);

      // Assert
      expect(sellerDao.findById).toHaveBeenCalledWith(sellerId);
    });
  });

  describe('Integration Tests', () => {
    let prisma: PrismaService;

    const createTestCompany = async(documentSuffix: string = '001') => {
      return await prisma.company.create({
        data: {
          name: `Test Company ${documentSuffix}`,
          fantasyName: `Test ${documentSuffix}`,
          document: `12345678${documentSuffix}190`,
          ie: `IE${documentSuffix}`,
          phone01: '1111111111',
          email01: `company${documentSuffix}@test.com`,
          zipCode: '12345678',
          street: 'Test St',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          active: true,
        },
      });
    };

    const createTestSellerWithAvatar = async(emailSuffix: string = '001', companies: any[] = []) => {
      const account = await prisma.account.create({
        data: {
          email: `seller${emailSuffix}@test.com`,
          password: 'hashedPassword',
          status: 'active',
        },
      });

      const role = await prisma.role.create({
        data: {
          accountId: account.id,
          role: AccountRole.SELLER,
        },
      });

      return await prisma.seller.create({
        data: {
          roleId: role.id,
          name: `Seller ${emailSuffix}`,
          nickname: `Nick ${emailSuffix}`,
          phone: '1111111111',
          cellphone: '11999999999',
          commission: 10,
          zipCode: '12345678',
          street: 'Test St',
          number: '123',
          complement: 'Apt 10',
          reference: 'Near park',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          observation: 'Good seller',
          avatarUrl: 'https://cdn.example.com/avatar-test.jpg',
          active: true,
          companies: {
            connect: companies.map(c => ({ id: c.id })),
          },
        },
      });
    };

    const createTestSellerWithoutAvatar = async(emailSuffix: string = '002', companies: any[] = []) => {
      const account = await prisma.account.create({
        data: {
          email: `seller${emailSuffix}@test.com`,
          password: 'hashedPassword',
          status: 'active',
        },
      });

      const role = await prisma.role.create({
        data: {
          accountId: account.id,
          role: AccountRole.SELLER,
        },
      });

      return await prisma.seller.create({
        data: {
          roleId: role.id,
          name: `Seller ${emailSuffix}`,
          nickname: null,
          phone: '2222222222',
          cellphone: '22888888888',
          commission: 15,
          zipCode: '87654321',
          street: 'Another St',
          number: '456',
          complement: null,
          reference: null,
          neighborhood: 'Another',
          city: 'Another City',
          state: 'AC',
          observation: null,
          avatarUrl: null,
          active: true,
          companies: {
            connect: companies.map(c => ({ id: c.id })),
          },
        },
      });
    };

    beforeEach(async() => {
      const module = await Test.createTestingModule({
        imports: [
          SellerModule,
          ConfigModule,
          DatabaseModule,
        ],
      }).compile();

      sut = module.get<FindSellerById>(FindSellerById);
      prisma = module.get<PrismaService>(PrismaService);

      // Clean database
      await prisma.seller.deleteMany();
      await prisma.role.deleteMany();
      await prisma.account.deleteMany();
      await prisma.company.deleteMany();
    });

    afterEach(async() => {
      await prisma.seller.deleteMany();
      await prisma.role.deleteMany();
      await prisma.account.deleteMany();
      await prisma.company.deleteMany();
    });

    it('should throw error when seller does not exist in database', async() => {
      // Act & Assert
      await expect(sut.execute('non-existent-id')).rejects.toThrow(SellerNotFoundError);
    });

    it('should find seller with avatar from database', async() => {
      // Arrange
      const company = await createTestCompany('001');
      const seller = await createTestSellerWithAvatar('001', [company]);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(seller.id);
      expect(result.name).toBe(seller.name);
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar-test.jpg');
      expect(result.avatarUrl).not.toBeNull();
    });

    it('should find seller without avatar from database', async() => {
      // Arrange
      const company = await createTestCompany('002');
      const seller = await createTestSellerWithoutAvatar('002', [company]);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(seller.id);
      expect(result.name).toBe(seller.name);
      expect(result.avatarUrl).toBeNull();
    });

    it('should return seller with all fields from database', async() => {
      // Arrange
      const company = await createTestCompany('003');
      const seller = await createTestSellerWithAvatar('003', [company]);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.id).toBe(seller.id);
      expect(result.name).toBe(seller.name);
      expect(result.nickname).toBe(seller.nickname);
      expect(result.phone).toBe(seller.phone);
      expect(result.cellphone).toBe(seller.cellphone);
      expect(result.commission).toBe(seller.commission);
      expect(result.zipCode).toBe(seller.zipCode);
      expect(result.street).toBe(seller.street);
      expect(result.number).toBe(seller.number);
      expect(result.complement).toBe(seller.complement);
      expect(result.reference).toBe(seller.reference);
      expect(result.neighborhood).toBe(seller.neighborhood);
      expect(result.city).toBe(seller.city);
      expect(result.state).toBe(seller.state);
      expect(result.observation).toBe(seller.observation);
      expect(result.avatarUrl).toBe(seller.avatarUrl);
      expect(result.active).toBe(seller.active);
    });

    it('should return seller with companies from database', async() => {
      // Arrange
      const company1 = await createTestCompany('001');
      const company2 = await createTestCompany('002');
      const seller = await createTestSellerWithAvatar('004', [company1, company2]);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.companies).toHaveLength(2);
      expect(result.companies.map(c => c.id)).toContain(company1.id);
      expect(result.companies.map(c => c.id)).toContain(company2.id);
    });

    it('should return seller without companies from database', async() => {
      // Arrange
      const seller = await createTestSellerWithoutAvatar('005', []);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.companies).toEqual([]);
      expect(result.companies).toHaveLength(0);
    });

    it('should return seller email from account relation', async() => {
      // Arrange
      const company = await createTestCompany('006');
      const seller = await createTestSellerWithAvatar('006', [company]);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.email).toBe('seller006@test.com');
    });

    it('should return seller with null optional fields from database', async() => {
      // Arrange
      const seller = await createTestSellerWithoutAvatar('007', []);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.nickname).toBeNull();
      expect(result.complement).toBeNull();
      expect(result.reference).toBeNull();
      expect(result.observation).toBeNull();
      expect(result.avatarUrl).toBeNull();
    });

    it('should return seller with filled optional fields from database', async() => {
      // Arrange
      const company = await createTestCompany('008');
      const seller = await createTestSellerWithAvatar('008', [company]);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.nickname).toBe('Nick 008');
      expect(result.complement).toBe('Apt 10');
      expect(result.reference).toBe('Near park');
      expect(result.observation).toBe('Good seller');
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar-test.jpg');
    });

    it('should return seller with createdAt and updatedAt dates', async() => {
      // Arrange
      const company = await createTestCompany('009');
      const seller = await createTestSellerWithAvatar('009', [company]);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should find inactive seller from database', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'inactive@test.com',
          password: 'hashedPassword',
          status: 'active',
        },
      });

      const role = await prisma.role.create({
        data: {
          accountId: account.id,
          role: AccountRole.SELLER,
        },
      });

      const seller = await prisma.seller.create({
        data: {
          roleId: role.id,
          name: 'Inactive Seller',
          phone: '3333333333',
          cellphone: '33999999999',
          commission: 5,
          zipCode: '11111111',
          street: 'Inactive St',
          number: '999',
          neighborhood: 'Inactive',
          city: 'Inactive City',
          state: 'IC',
          active: false,
          avatarUrl: null,
        },
      });

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result.active).toBe(false);
      expect(result.id).toBe(seller.id);
    });

    it('should find multiple different sellers by id', async() => {
      // Arrange
      const company = await createTestCompany('010');
      const seller1 = await createTestSellerWithAvatar('010', [company]);
      const seller2 = await createTestSellerWithoutAvatar('011', [company]);

      // Act
      const result1 = await sut.execute(seller1.id);
      const result2 = await sut.execute(seller2.id);

      // Assert
      expect(result1.id).toBe(seller1.id);
      expect(result1.avatarUrl).not.toBeNull();
      expect(result2.id).toBe(seller2.id);
      expect(result2.avatarUrl).toBeNull();
      expect(result1.id).not.toBe(result2.id);
    });
  });
});
