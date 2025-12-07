import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SellerModule } from '../../../seller.module';
import { SellerDto } from '../../dtos/seller.dto';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { FindAllSellerQueryDto } from './dtos/find-all-seller.dto';
import { FindAllSeller } from './find-all-seller.service';

describe('FindAllSeller', () => {
  let sut: FindAllSeller;
  let prisma: PrismaService;
  let createSeller: CreateSeller;
  let baseSellerData: CreateSellerInputDto;
  let createdSellerIds: string[];
  let companyId1: string;
  let companyId2: string;
  let companyId3: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SellerModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllSeller);
    prisma = module.get(PrismaService);
    createSeller = module.get(CreateSeller);

    await prisma.seller.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();

    // Create test companies
    const company1 = await prisma.company.create({
      data: {
        name: 'Test Company 1',
        fantasyName: 'Company 1',
        document: '51456427000130',
        ie: '111111111',
        zipCode: '12345678',
        street: 'Test Street 1',
        number: '100',
        neighborhood: 'District 1',
        city: 'City 1',
        state: 'C1',
        phone01: '1111111111',
        email01: 'company1@test.com',
        active: true,
      },
    });
    companyId1 = company1.id;

    const company2 = await prisma.company.create({
      data: {
        name: 'Test Company 2',
        fantasyName: 'Company 2',
        document: '23211777000109',
        ie: '222222222',
        zipCode: '87654321',
        street: 'Test Street 2',
        number: '200',
        neighborhood: 'District 2',
        city: 'City 2',
        state: 'C2',
        phone01: '2222222222',
        email01: 'company2@test.com',
        active: true,
      },
    });
    companyId2 = company2.id;

    const company3 = await prisma.company.create({
      data: {
        name: 'Test Company 3',
        fantasyName: 'Company 3',
        document: '12345678909',
        ie: '333333333',
        zipCode: '11223344',
        street: 'Test Street 3',
        number: '300',
        neighborhood: 'District 3',
        city: 'City 3',
        state: 'C3',
        phone01: '3333333333',
        email01: 'company3@test.com',
        active: true,
      },
    });
    companyId3 = company3.id;

    baseSellerData = {
      name: 'Base Seller',
      nickname: 'Base',
      email: 'base@test.com',
      password: 'BasePassword123!',
      phone: '1122223333',
      cellphone: '11999998888',
      zipCode: '01000000',
      street: 'Rua das Flores',
      number: '100',
      complement: null,
      reference: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      observation: null,
      commission: 5,
      companyIds: [],
    };

    // Create diverse test sellers for comprehensive filter testing
    createdSellerIds = [];

    // Seller 1: Alice Alpha - No companies
    const seller1 = await createSeller.execute({
      ...baseSellerData,
      name: 'Alice Alpha Smith',
      nickname: 'Alice A',
      email: 'alice.alpha@test.com',
      phone: '1111111111',
      cellphone: '11911111111',
      street: 'Alpha Street',
      number: '111',
      commission: 10,
      companyIds: [],
    });
    createdSellerIds.push(seller1.id);

    // Seller 2: Bob Beta - Company 1
    const seller2 = await createSeller.execute({
      ...baseSellerData,
      name: 'Bob Beta Santos',
      nickname: 'Beta Bob',
      email: 'bob.beta@test.com',
      phone: '2122222222',
      cellphone: '21922222222',
      street: 'Beta Avenue',
      number: '222',
      commission: 15,
      companyIds: [companyId1],
    });
    createdSellerIds.push(seller2.id);

    // Seller 3: Charlie Gamma - Companies 1 and 2
    const seller3 = await createSeller.execute({
      ...baseSellerData,
      name: 'Charlie Gamma Wilson',
      nickname: 'Gamma',
      email: 'charlie.gamma@test.com',
      phone: '3133333333',
      cellphone: '31933333333',
      street: 'Gamma Road',
      number: '333',
      commission: 20,
      companyIds: [companyId1, companyId2],
    });
    createdSellerIds.push(seller3.id);

    // Seller 4: Diana Delta - Company 2
    const seller4 = await createSeller.execute({
      ...baseSellerData,
      name: 'Diana Delta Costa',
      nickname: 'Di Delta',
      email: 'diana.delta@test.com',
      phone: '4144444444',
      cellphone: '41944444444',
      street: 'Delta Boulevard',
      number: '444',
      commission: 8,
      companyIds: [companyId2],
    });
    createdSellerIds.push(seller4.id);

    // Seller 5: Edward Epsilon - Company 3
    const seller5 = await createSeller.execute({
      ...baseSellerData,
      name: 'Edward Epsilon Lima',
      nickname: 'Eddie',
      email: 'edward.epsilon@test.com',
      phone: '5155555555',
      cellphone: '51955555555',
      street: 'Epsilon Street',
      number: '555',
      commission: 12,
      companyIds: [companyId3],
    });
    createdSellerIds.push(seller5.id);

    // Seller 6: Fiona Foxtrot - All companies
    const seller6 = await createSeller.execute({
      ...baseSellerData,
      name: 'Fiona Foxtrot Silva',
      nickname: 'Fox',
      email: 'fiona.foxtrot@test.com',
      phone: '6166666666',
      cellphone: '61966666666',
      street: 'Foxtrot Avenue',
      number: '666',
      commission: 25,
      companyIds: [companyId1, companyId2, companyId3],
    });
    createdSellerIds.push(seller6.id);

    // Deactivate seller 5 for active filter tests
    await prisma.seller.update({
      where: { id: createdSellerIds[4] },
      data: { active: false },
    });
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

  describe('execute', () => {
    it('should call sellerDao with correct parameters', async() => {
      // Arrange
      const findAllSpy = jest.spyOn(sut['sellerDao'], 'findAll').mockResolvedValue([[], 0]);
      const queries: FindAllSellerQueryDto = { page: 1, size: 10 };

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return a Pagination object with correct structure', async() => {
      // Arrange
      const queries: FindAllSellerQueryDto = { page: 1, size: 10 };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<IPagination<SellerDto>>({
        data: expect.any(Array),
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    describe('pagination', () => {
      it('should return first page with default size of 10', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(1);
        expect(result.data.length).toBeLessThanOrEqual(10);
        expect(result.totalItems).toBe(6); // 6 sellers created
      });

      it('should return correct page with custom page size', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { page: 1, size: 3 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(1);
        expect(result.data.length).toBe(3);
        expect(result.totalItems).toBe(6);
        expect(result.totalPages).toBe(2);
      });

      it('should return second page correctly', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { page: 2, size: 3 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(2);
        expect(result.data.length).toBe(3);
        expect(result.totalItems).toBe(6);
      });

      it('should return empty data array when page exceeds total pages', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { page: 10, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(10);
        expect(result.data.length).toBe(0);
        expect(result.totalItems).toBe(6);
      });

      it('should handle size 1 correctly', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { page: 1, size: 1 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(1);
        expect(result.data.length).toBe(1);
        expect(result.totalItems).toBe(6);
        expect(result.totalPages).toBe(6);
      });
    });

    describe('name filter', () => {
      it('should filter sellers by exact name match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { name: 'Alice Alpha Smith', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toBe('Alice Alpha Smith');
      });

      it('should filter sellers by partial name match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { name: 'Alpha', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toContain('Alpha');
      });

      it('should return empty array when name does not match any seller', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { name: 'NonExistent', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
      });

      it('should be case insensitive', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { name: 'alice', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBeGreaterThan(0);
      });
    });

    describe('nickname filter', () => {
      it('should filter sellers by exact nickname match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { nickname: 'Eddie', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].nickname).toBe('Eddie');
      });

      it('should filter sellers by partial nickname match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { nickname: 'Beta', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].nickname).toContain('Beta');
      });

      it('should return empty array when nickname does not match any seller', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { nickname: 'NonExistent', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
      });
    });

    describe('email filter', () => {
      it('should filter sellers by exact email match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { email: 'bob.beta@test.com', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].email).toBe('bob.beta@test.com');
      });

      it('should filter sellers by partial email match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { email: 'gamma', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].email).toContain('gamma');
      });

      it('should return empty array when email does not match any seller', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { email: 'nonexistent@test.com', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
      });
    });

    describe('phone filter', () => {
      it('should filter sellers by exact phone match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { phone: '1111111111', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].phone).toBe('1111111111');
      });

      it('should filter sellers by partial phone match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { phone: '2122', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].phone).toContain('2122');
      });

      it('should return empty array when phone does not match any seller', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { phone: '9999999999', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
      });
    });

    describe('cellphone filter', () => {
      it('should filter sellers by exact cellphone match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { cellphone: '31933333333', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].cellphone).toBe('31933333333');
      });

      it('should filter sellers by partial cellphone match', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { cellphone: '11911', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].cellphone).toContain('11911');
      });

      it('should return empty array when cellphone does not match any seller', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { cellphone: '99999999999', page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
      });
    });

    describe('companyIds filter', () => {
      it('should filter sellers by single company', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { companyIds: [companyId1], page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(3); // Sellers 2, 3, 6
        result.data.forEach(seller => {
          expect(seller.companies?.some(c => c.id === companyId1)).toBe(true);
        });
      });

      it('should filter sellers by multiple companies (OR logic)', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { companyIds: [companyId1, companyId2], page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(4); // Sellers 2, 3, 4, 6
      });

      it('should return sellers associated with specific company only', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { companyIds: [companyId3], page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(2); // Sellers 5, 6 (but seller 5 is inactive)
      });

      it('should return empty array when no sellers are associated with the company', async() => {
        // Arrange
        const nonExistentCompanyId = 'non-existent-company-id';
        const queries: FindAllSellerQueryDto = { companyIds: [nonExistentCompanyId], page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
      });
    });

    describe('active filter', () => {
      it('should filter only active sellers when active is true', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { active: true, page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(5); // All except seller 5
        result.data.forEach(seller => {
          expect(seller.active).toBe(true);
        });
      });

      it('should filter only inactive sellers when active is false', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { active: false, page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1); // Only seller 5
        result.data.forEach(seller => {
          expect(seller.active).toBe(false);
        });
      });

      it('should return all sellers when active filter is not provided', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(6); // All sellers
      });
    });

    describe('combined filters', () => {
      it('should apply name and active filters together', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { name: 'Epsilon', active: false, page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toContain('Epsilon');
        expect(result.data[0].active).toBe(false);
      });

      it('should apply companyIds and active filters together', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { companyIds: [companyId1], active: true, page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(3); // Sellers 2, 3, 6 (all active)
        result.data.forEach(seller => {
          expect(seller.active).toBe(true);
          expect(seller.companies?.some(c => c.id === companyId1)).toBe(true);
        });
      });

      it('should apply email and companyIds filters together', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { email: 'gamma', companyIds: [companyId1], page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].email).toContain('gamma');
        expect(result.data[0].companies?.some(c => c.id === companyId1)).toBe(true);
      });

      it('should apply nickname, phone, and active filters together', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { nickname: 'Alice', phone: '1111', active: true, page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].nickname).toContain('Alice');
        expect(result.data[0].phone).toContain('1111');
        expect(result.data[0].active).toBe(true);
      });

      it('should return empty when combined filters match no sellers', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { name: 'Alice', companyIds: [companyId2], page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
      });
    });

    describe('pagination with filters', () => {
      it('should paginate filtered results correctly', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { active: true, page: 1, size: 2 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(1);
        expect(result.data.length).toBe(2);
        expect(result.totalItems).toBe(5);
        expect(result.totalPages).toBe(3);
      });

      it('should return second page of filtered results', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { active: true, page: 2, size: 2 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(2);
        expect(result.data.length).toBe(2);
        expect(result.totalItems).toBe(5);
      });

      it('should handle last page with remaining items', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { active: true, page: 3, size: 2 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.currentPage).toBe(3);
        expect(result.data.length).toBe(1); // Only 1 item on last page (5 total / 2 per page)
        expect(result.totalItems).toBe(5);
      });
    });

    describe('edge cases', () => {
      it('should return all sellers when no filters are applied', async() => {
        // Arrange
        const queries: FindAllSellerQueryDto = { page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(6);
        expect(result.data.length).toBe(6);
      });

      it('should handle empty database gracefully', async() => {
        // Arrange
        await prisma.seller.deleteMany();
        const queries: FindAllSellerQueryDto = { page: 1, size: 10 };

        // Act
        const result: IPagination<SellerDto> = await sut.execute(queries);

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data.length).toBe(0);
        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBe(0);
      });
    });
  });
});
