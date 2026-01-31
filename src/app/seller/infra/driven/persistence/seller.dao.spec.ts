import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import { SellerPersistenceModule } from 'src/app/seller/application/persistence/seller-persistence.module';
import { FindAllSellerQueryDto } from 'src/app/seller/application/usecases/find-all-seller/dtos/find-all-seller.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerDaoAdapterPrisma } from './seller.dao';

describe('SellerDaoAdapterPrisma', () => {
  let sut: SellerDaoAdapterPrisma;
  let prisma: PrismaService;
  let company01: Company;
  let company02: Company;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        SellerPersistenceModule,
        ConfigModule,
      ],
      providers: [
        SellerDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(SellerDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();

    company01 = await prisma.company.create({
      data: {
        name: 'Company 01',
        fantasyName: 'Company 01 Fantasy',
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

    company02 = await prisma.company.create({
      data: {
        name: 'Company 02',
        fantasyName: 'Company 02 Fantasy',
        document: '22333444000105',
        ie: 'ie teste 02',
        zipCode: 'zipCode teste 02',
        street: 'street teste 02',
        number: 'number teste 02',
        neighborhood: 'neighborhood teste 02',
        city: 'city teste 02',
        state: 'state teste 02',
        phone01: 'phone01 teste 02',
        email01: 'email01 teste 02',
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(async() => {
      await prisma.seller.create({
        data: {
          id: 'seller-1',
          name: 'John Doe',
          nickname: 'Johnny',
          phone: '1111-1111',
          cellphone: '11111-1111',
          commission: 5.5,
          zipCode: '12345-678',
          street: 'Main Street',
          number: '100',
          complement: 'Apt 1',
          reference: 'Near park',
          neighborhood: 'Downtown',
          city: 'São Paulo',
          state: 'SP',
          observation: 'Top seller',
          avatarUrl: 'https://avatar.com/john.jpg',
          active: true,
          role: {
            create: {
              role: AccountRole.SELLER,
              account: {
                create: {
                  email: 'seller1@test.com',
                  password: 'hashed_password_1',
                  status: AccountStatus.ACTIVE,
                },
              },
            },
          },
          companies: { connect: { id: company01.id } },
        },
      });

      await prisma.seller.create({
        data: {
          id: 'seller-2',
          name: 'Jane Smith',
          nickname: 'Janie',
          phone: '2222-2222',
          cellphone: '22222-2222',
          commission: 7.0,
          zipCode: '87654-321',
          street: 'Second Avenue',
          number: '200',
          complement: null,
          reference: null,
          neighborhood: 'Uptown',
          city: 'Rio de Janeiro',
          state: 'RJ',
          observation: null,
          avatarUrl: null,
          active: true,
          role: {
            create: {
              role: AccountRole.SELLER,
              account: {
                create: {
                  email: 'seller2@test.com',
                  password: 'hashed_password_2',
                  status: AccountStatus.ACTIVE,
                },
              },
            },
          },
          companies: { connect: { id: company02.id } },
        },
      });

      await prisma.seller.create({
        data: {
          id: 'seller-3',
          name: 'Robert Johnson',
          nickname: 'Bob',
          phone: '3333-3333',
          cellphone: '33333-3333',
          commission: 6.0,
          zipCode: '11223-344',
          street: 'Third Boulevard',
          number: '300',
          complement: 'Suite 5',
          reference: 'Next to mall',
          neighborhood: 'Midtown',
          city: 'Belo Horizonte',
          state: 'MG',
          observation: 'New seller',
          avatarUrl: 'https://avatar.com/bob.jpg',
          active: false,
          role: {
            create: {
              role: AccountRole.SELLER,
              account: {
                create: {
                  email: 'seller3@test.com',
                  password: 'hashed_password_3',
                  status: AccountStatus.ACTIVE,
                },
              },
            },
          },
          companies: { connect: [{ id: company01.id }, { id: company02.id }] },
        },
      });
    });

    it('should return all sellers when no filters are provided', async() => {
      // Arrange
      const query: FindAllSellerQueryDto = {};

      // Act
      const [sellers, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(3);
      expect(sellers).toHaveLength(3);
    });

    it('should order results by createdAt desc', async() => {
      // Arrange
      const query: FindAllSellerQueryDto = {};

      // Act
      const [sellers] = await sut.findAll(query);

      // Assert
      expect(sellers[0].id).toBe('seller-3');
      expect(sellers[1].id).toBe('seller-2');
      expect(sellers[2].id).toBe('seller-1');
    });

    describe('filter by name', () => {
      it('should filter by name - exact match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'John Doe' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].name).toBe('John Doe');
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by name - partial match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'John' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2); // John Doe and Robert Johnson
        expect(sellers).toHaveLength(2);
      });

      it('should filter by name - case insensitive', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'JANE SMITH' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].name).toBe('Jane Smith');
      });

      it('should return empty when name does not match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'NonExistent' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('filter by nickname', () => {
      it('should filter by nickname - exact match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { nickname: 'Johnny' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].nickname).toBe('Johnny');
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by nickname - partial match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { nickname: 'an' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1); // Janie
        expect(sellers[0].nickname).toBe('Janie');
      });

      it('should filter by nickname - case insensitive', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { nickname: 'BOB' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].nickname).toBe('Bob');
      });

      it('should return empty when nickname does not match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { nickname: 'NonExistent' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('filter by email', () => {
      it('should filter by email - exact match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { email: 'seller1@test.com' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].email).toBe('seller1@test.com');
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by email - partial match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { email: 'seller' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(sellers).toHaveLength(3);
      });

      it('should filter by email - case insensitive', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { email: 'SELLER2@TEST.COM' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].email).toBe('seller2@test.com');
      });

      it('should return empty when email does not match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { email: 'nonexistent@test.com' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('filter by phone', () => {
      it('should filter by phone - exact match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { phone: '1111-1111' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].phone).toBe('1111-1111');
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by phone - partial match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { phone: '1111' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should return empty when phone does not match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { phone: '9999-9999' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('filter by cellphone', () => {
      it('should filter by cellphone - exact match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { cellphone: '22222-2222' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].cellphone).toBe('22222-2222');
        expect(sellers[0].id).toBe('seller-2');
      });

      it('should filter by cellphone - partial match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { cellphone: '3333' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].id).toBe('seller-3');
      });

      it('should return empty when cellphone does not match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { cellphone: '99999-9999' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('filter by address', () => {
      it('should filter by address - match city', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'São Paulo' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].city).toBe('São Paulo');
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by address - match state', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'RJ' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].state).toBe('RJ');
        expect(sellers[0].id).toBe('seller-2');
      });

      it('should filter by address - match street', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'Main Street' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].street).toBe('Main Street');
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by address - match neighborhood', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'Uptown' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].neighborhood).toBe('Uptown');
        expect(sellers[0].id).toBe('seller-2');
      });

      it('should filter by address - match zipCode', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: '12345-678' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].zipCode).toBe('12345-678');
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by address - match number', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: '200' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].number).toBe('200');
        expect(sellers[0].id).toBe('seller-2');
      });

      it('should filter by address - case insensitive', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'SÃO PAULO' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].city).toBe('São Paulo');
      });

      it('should filter by address - partial match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'town' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3); // Downtown, Uptown, Midtown
        expect(sellers).toHaveLength(3);
      });

      it('should return empty when address does not match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'NonExistent Address' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('filter by companyIds', () => {
      it('should filter by single companyId', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { companyIds: [company01.id] };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        const sellerIds = sellers.map(s => s.id).sort();
        expect(sellerIds).toEqual(['seller-1', 'seller-3']);
      });

      it('should filter by multiple companyIds', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { companyIds: [company01.id, company02.id] };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(sellers).toHaveLength(3);
      });

      it('should return empty when companyIds has non-existent id', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { companyIds: ['non-existent-company-id'] };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('filter by active', () => {
      it('should filter by active = true', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { active: true };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        sellers.forEach(seller => {
          expect(seller.active).toBe(true);
        });
      });

      it('should filter by active = false', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { active: false };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].id).toBe('seller-3');
        expect(sellers[0].active).toBe(false);
      });
    });

    describe('pagination', () => {
      it('should paginate results - first page', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { page: 1, size: 2 };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(sellers).toHaveLength(2);
      });

      it('should paginate results - second page', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { page: 2, size: 2 };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(sellers).toHaveLength(1);
      });

      it('should return empty when page exceeds available results', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { page: 10, size: 10 };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(sellers).toHaveLength(0);
      });

      it('should return all results when no pagination provided', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = {};

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(sellers).toHaveLength(3);
      });
    });

    describe('combined filters', () => {
      it('should filter by name AND active', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'John', active: true };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1); // John Doe
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by email AND companyIds', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { email: 'seller', companyIds: [company01.id] };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2); // seller-1 and seller-3 (both have company01)
        expect(sellers).toHaveLength(2);
      });

      it('should filter by address AND active', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { address: 'town', active: true };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2); // Downtown (active) and Uptown (active), not Midtown (inactive)
        expect(sellers).toHaveLength(2);
      });

      it('should filter by nickname AND phone', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { nickname: 'Johnny', phone: '1111' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(sellers[0].id).toBe('seller-1');
      });

      it('should filter by multiple fields with pagination', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = {
          name: 'John',
          companyIds: [company01.id],
          page: 1,
          size: 1,
        };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(sellers).toHaveLength(1);
      });

      it('should return empty when combined filters do not match', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'John', email: 'seller2@test.com' };

        // Act
        const [sellers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(sellers).toHaveLength(0);
      });
    });

    describe('DTO mapping', () => {
      it('should return correct DTO structure with all fields', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'John Doe' };

        // Act
        const [sellers] = await sut.findAll(query);

        // Assert
        expect(sellers[0]).toEqual<SellerDto>({
          id: 'seller-1',
          name: 'John Doe',
          nickname: 'Johnny',
          phone: '1111-1111',
          cellphone: '11111-1111',
          email: 'seller1@test.com',
          commission: 5.5,
          zipCode: '12345-678',
          street: 'Main Street',
          number: '100',
          complement: 'Apt 1',
          reference: 'Near park',
          neighborhood: 'Downtown',
          city: 'São Paulo',
          state: 'SP',
          observation: 'Top seller',
          avatarUrl: 'https://avatar.com/john.jpg',
          active: true,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          companies: [
            {
              id: company01.id,
              name: 'Company 01',
            },
          ],
        });
      });

      it('should handle nullable fields correctly', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'Jane Smith' };

        // Act
        const [sellers] = await sut.findAll(query);

        // Assert
        expect(sellers[0].complement).toBeNull();
        expect(sellers[0].reference).toBeNull();
        expect(sellers[0].observation).toBeNull();
        expect(sellers[0].avatarUrl).toBeNull();
      });

      it('should include companies array', async() => {
        // Arrange
        const query: FindAllSellerQueryDto = { name: 'Robert Johnson' };

        // Act
        const [sellers] = await sut.findAll(query);

        // Assert
        expect(sellers[0].companies).toHaveLength(2);
        expect(sellers[0].companies).toEqual(
          expect.arrayContaining([
            { id: company01.id, name: 'Company 01' },
            { id: company02.id, name: 'Company 02' },
          ]),
        );
      });
    });
  });

  describe('findById', () => {
    beforeEach(async() => {
      await prisma.seller.create({
        data: {
          id: 'seller-test-id',
          name: 'Test Seller',
          nickname: 'Tester',
          phone: '1234-5678',
          cellphone: '12345-6789',
          commission: 5.0,
          zipCode: '12345-678',
          street: 'Test Street',
          number: '123',
          complement: null,
          reference: null,
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'TS',
          observation: null,
          avatarUrl: null,
          active: true,
          role: {
            create: {
              role: AccountRole.SELLER,
              account: {
                create: {
                  email: 'testfindbyid@test.com',
                  password: 'hashed_password',
                  status: AccountStatus.ACTIVE,
                },
              },
            },
          },
          companies: { connect: { id: company01.id } },
        },
      });
    });

    it('should return seller when id exists', async() => {
      // Act
      const seller = await sut.findById('seller-test-id');

      // Assert
      expect(seller).not.toBeNull();
      expect(seller?.id).toBe('seller-test-id');
      expect(seller?.name).toBe('Test Seller');
      expect(seller?.email).toBe('testfindbyid@test.com');
    });

    it('should return null when id does not exist', async() => {
      // Act
      const seller = await sut.findById('non-existent-id');

      // Assert
      expect(seller).toBeNull();
    });

    it('should return correct DTO structure', async() => {
      // Act
      const seller = await sut.findById('seller-test-id');

      // Assert
      expect(seller).toEqual<SellerDto>({
        id: 'seller-test-id',
        name: 'Test Seller',
        nickname: 'Tester',
        phone: '1234-5678',
        cellphone: '12345-6789',
        email: 'testfindbyid@test.com',
        commission: 5.0,
        zipCode: '12345-678',
        street: 'Test Street',
        number: '123',
        complement: null,
        reference: null,
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TS',
        observation: null,
        avatarUrl: null,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: [
          {
            id: company01.id,
            name: 'Company 01',
          },
        ],
      });
    });

    it('should include email from role.account relation', async() => {
      // Act
      const seller = await sut.findById('seller-test-id');

      // Assert
      expect(seller?.email).toBe('testfindbyid@test.com');
    });

    it('should include companies array', async() => {
      // Act
      const seller = await sut.findById('seller-test-id');

      // Assert
      expect(seller?.companies).toHaveLength(1);
      expect(seller?.companies[0]).toEqual({
        id: company01.id,
        name: 'Company 01',
      });
    });
  });

  describe('findByEmail', () => {
    beforeEach(async() => {
      await prisma.seller.create({
        data: {
          id: 'seller-email-test',
          name: 'Email Test Seller',
          nickname: 'EmailTester',
          phone: '9876-5432',
          cellphone: '98765-4321',
          commission: 8.0,
          zipCode: '98765-432',
          street: 'Email Street',
          number: '999',
          complement: null,
          reference: null,
          neighborhood: 'Email Neighborhood',
          city: 'Email City',
          state: 'EC',
          observation: null,
          avatarUrl: null,
          active: true,
          role: {
            create: {
              role: AccountRole.SELLER,
              account: {
                create: {
                  email: 'testfindbyemail@test.com',
                  password: 'hashed_password',
                  status: AccountStatus.ACTIVE,
                },
              },
            },
          },
          companies: { connect: { id: company02.id } },
        },
      });
    });

    it('should return seller when email exists', async() => {
      // Act
      const seller = await sut.findByEmail('testfindbyemail@test.com');

      // Assert
      expect(seller).not.toBeNull();
      expect(seller?.id).toBe('seller-email-test');
      expect(seller?.email).toBe('testfindbyemail@test.com');
      expect(seller?.name).toBe('Email Test Seller');
    });

    it('should return null when email does not exist', async() => {
      // Act
      const seller = await sut.findByEmail('nonexistent@test.com');

      // Assert
      expect(seller).toBeNull();
    });

    it('should return correct DTO structure', async() => {
      // Act
      const seller = await sut.findByEmail('testfindbyemail@test.com');

      // Assert
      expect(seller).toEqual<SellerDto>({
        id: 'seller-email-test',
        name: 'Email Test Seller',
        nickname: 'EmailTester',
        phone: '9876-5432',
        cellphone: '98765-4321',
        email: 'testfindbyemail@test.com',
        commission: 8.0,
        zipCode: '98765-432',
        street: 'Email Street',
        number: '999',
        complement: null,
        reference: null,
        neighborhood: 'Email Neighborhood',
        city: 'Email City',
        state: 'EC',
        observation: null,
        avatarUrl: null,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: [
          {
            id: company02.id,
            name: 'Company 02',
          },
        ],
      });
    });

    it('should find seller by exact email match', async() => {
      // Act
      const seller = await sut.findByEmail('testfindbyemail@test.com');

      // Assert
      expect(seller?.id).toBe('seller-email-test');
    });

    it('should find seller by case-insensitive email match', async() => {
      // Act
      const seller = await sut.findByEmail('TESTFINDBYEMAIL@TEST.COM');

      // Assert
      expect(seller?.id).toBe('seller-email-test');
    });

    it('should include companies in the result', async() => {
      // Act
      const seller = await sut.findByEmail('testfindbyemail@test.com');

      // Assert
      expect(seller?.companies).toHaveLength(1);
      expect(seller?.companies[0]).toEqual({
        id: company02.id,
        name: 'Company 02',
      });
    });
  });
});
