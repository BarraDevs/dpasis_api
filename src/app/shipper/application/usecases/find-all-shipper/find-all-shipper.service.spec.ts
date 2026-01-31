import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ShipperModule } from '../../../shipper.module';
import { ShipperDto } from '../../dtos/shipper.dto';
import { CreateShipper } from '../create-shipper/create-shipper.service';
import { CreateShipperInputDto } from '../create-shipper/dtos/create-shipper.dto';
import { FindAllShipperQueryDto } from './dtos/find-all-shipper.dto';
import { FindAllShipper } from './find-all-shipper.service';

describe('FindAllShipper', () => {
  let sut: FindAllShipper;
  let prisma: PrismaService;
  let createShipper: CreateShipper;
  let baseShipperData: CreateShipperInputDto;
  let createdShipperIds: string[];
  let companyId1: string;
  let companyId2: string;
  let companyId3: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllShipper);
    prisma = module.get(PrismaService);
    createShipper = module.get(CreateShipper);

    await prisma.truncate();

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

    baseShipperData = {
      companyName: 'Transportadora Base Ltda',
      fantasyName: 'Transportadora Base',
      cnpj: '32002057000116',
      contact: '(11) 98765-4321',
      representative: 'João Silva',
      zipCode: '01234-567',
      street: 'Rua das Flores',
      number: '100',
      complement: null,
      reference: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      companyIds: [],
    };

    // Create diverse test shippers for comprehensive filter testing
    createdShipperIds = [];

    // Shipper 1: Alpha Express - No companies
    const shipper1 = await createShipper.execute({
      ...baseShipperData,
      cnpj: '45593489000190',
      contact: '(11) 91111-1111',
      companyName: 'Alpha Express Transportes Ltd',
      fantasyName: 'Alpha Express',
      representative: 'John Alpha Smith',
      zipCode: '01111-111',
      street: 'Alpha Street',
      number: '111',
      neighborhood: 'Alpha District',
      city: 'São Paulo',
      state: 'SP',
      companyIds: [],
    });
    createdShipperIds.push(shipper1.id);

    // Shipper 2: Beta Logistics - Company 1
    const shipper2 = await createShipper.execute({
      ...baseShipperData,
      cnpj: '90477694000145',
      contact: '(21) 92222-2222',
      companyName: 'Beta Logistics Internacional',
      fantasyName: 'Beta Logistics',
      representative: 'Jane Beta Santos',
      zipCode: '02222-222',
      street: 'Beta Avenue',
      number: '222',
      neighborhood: 'Beta District',
      city: 'Rio de Janeiro',
      state: 'RJ',
      companyIds: [companyId1],
    });
    createdShipperIds.push(shipper2.id);

    // Shipper 3: Gamma Corporation - Companies 1 and 2
    const shipper3 = await createShipper.execute({
      ...baseShipperData,
      cnpj: '73906690000116',
      contact: '(31) 93333-3333',
      companyName: 'Gamma Corporation Transportes',
      fantasyName: 'Gamma Corp',
      representative: 'Robert Gamma Wilson',
      zipCode: '03333-333',
      street: 'Gamma Road',
      number: '333',
      complement: 'Suite 10',
      reference: 'Near shopping',
      neighborhood: 'Gamma District',
      city: 'Belo Horizonte',
      state: 'MG',
      companyIds: [companyId1, companyId2],
    });
    createdShipperIds.push(shipper3.id);

    // Shipper 4: Delta Freight - Company 2
    const shipper4 = await createShipper.execute({
      ...baseShipperData,
      cnpj: '33651573000134',
      contact: '(41) 94444-4444',
      companyName: 'Delta Freight Services Inc',
      fantasyName: 'Delta Freight',
      representative: 'Maria Delta Costa',
      zipCode: '04444-444',
      street: 'Delta Boulevard',
      number: '444',
      neighborhood: 'Delta District',
      city: 'Curitiba',
      state: 'PR',
      companyIds: [companyId2],
    });
    createdShipperIds.push(shipper4.id);

    // Shipper 5: Epsilon Cargo - Company 3
    const shipper5 = await createShipper.execute({
      ...baseShipperData,
      cnpj: '32866784000121',
      contact: '(51) 95555-5555',
      companyName: 'Epsilon Cargo Solutions',
      fantasyName: 'Epsilon Cargo',
      representative: 'Carlos Epsilon Lima',
      zipCode: '05555-555',
      street: 'Epsilon Street',
      number: '555',
      neighborhood: 'Epsilon District',
      city: 'Porto Alegre',
      state: 'RS',
      companyIds: [companyId3],
    });
    createdShipperIds.push(shipper5.id);

    // Shipper 6: Foxtrot Shipping - All companies
    const shipper6 = await createShipper.execute({
      ...baseShipperData,
      cnpj: '70261804000120',
      contact: '(61) 96666-6666',
      companyName: 'Foxtrot Shipping Worldwide',
      fantasyName: 'Foxtrot Shipping',
      representative: 'Ana Foxtrot Silva',
      zipCode: '06666-666',
      street: 'Foxtrot Avenue',
      number: '666',
      complement: 'Building A',
      neighborhood: 'Foxtrot District',
      city: 'Brasília',
      state: 'DF',
      companyIds: [companyId1, companyId2, companyId3],
    });
    createdShipperIds.push(shipper6.id);
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    it('should call shipperDao with correct parameters', async() => {
      // Arrange
      const findAllSpy = jest.spyOn(sut['shipperDao'], 'findAll').mockResolvedValue([[], 0]);
      const queries: FindAllShipperQueryDto = { page: 1, size: 10 };

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return a Pagination object with correct structure', async() => {
      // Arrange
      const mockData: ShipperDto[] = [{ id: 'test-id' } as ShipperDto];
      jest.spyOn(sut['shipperDao'], 'findAll').mockResolvedValue([mockData, 1]);

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('currentPage');
      expect(result).toHaveProperty('itemsPerPage');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalPages');
    });
  });

  describe('Integration tests - Basic functionality', () => {
    it('should return an empty result when no shippers exist', async() => {
      // Arrange
      await prisma.shipper.deleteMany(); // Ensure database is clean

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toEqual<IPagination<ShipperDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return all shippers when no filters are provided', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.itemsPerPage).toBe(6);

      // Verify all created shippers are returned
      const returnedIds = result.data.map(shipper => shipper.id).sort();
      const expectedIds = [...createdShipperIds].sort();
      expect(returnedIds).toEqual(expectedIds);
    });

    it('should handle pagination correctly', async() => {
      // Act
      const result = await sut.execute({ page: 2, size: 2 });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(2);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should return correct dto structure', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const shipper = result.data.filter(s => s.companies.length > 0)[0];
      expect(shipper).toEqual<ShipperDto>({
        id: expect.any(String),
        companyName: expect.any(String),
        fantasyName: expect.any(String),
        cnpj: expect.any(String),
        contact: expect.any(String),
        representative: expect.any(String),
        zipCode: expect.any(String),
        street: expect.any(String),
        number: expect.any(String),
        complement: expect.any(String),
        reference: null,
        neighborhood: expect.any(String),
        city: expect.any(String),
        state: expect.any(String),
        active: expect.any(Boolean),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('Integration tests - Individual filter tests', () => {
    it('should filter by cnpj - exact match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '33651573000134' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('33651573000134');
      expect(result.data[0].id).toBe(createdShipperIds[3]);
    });

    it('should filter by cnpj - partial match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '7026180' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('70261804000120');
      expect(result.data[0].id).toBe(createdShipperIds[5]);
    });

    it('should filter by companyName - partial match', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Alpha' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toBe('Alpha Express Transportes Ltd');
    });

    it('should filter by companyName - multiple matches', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Corp' });

      // Assert
      expect(result.totalItems).toBe(1); // Gamma Corporation
      expect(result.data).toHaveLength(1);
    });

    it('should filter by fantasyName', async() => {
      // Act
      const result = await sut.execute({ fantasyName: 'Express' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fantasyName).toBe('Alpha Express');
    });

    it('should filter by representative', async() => {
      // Act
      const result = await sut.execute({ representative: 'Smith' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].representative).toBe('John Alpha Smith');
    });

    it('should filter by contact', async() => {
      // Act
      const result = await sut.execute({ contact: '91111' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].contact).toBe('(11) 91111-1111');
    });

    it('should filter by address - street', async() => {
      // Act
      const result = await sut.execute({ address: 'Alpha Street' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].street).toBe('Alpha Street');
    });

    it('should filter by address - city', async() => {
      // Act
      const result = await sut.execute({ address: 'São Paulo' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].city).toBe('São Paulo');
    });

    it('should filter by address - neighborhood', async() => {
      // Act
      const result = await sut.execute({ address: 'Beta District' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].neighborhood).toBe('Beta District');
    });

    it('should filter by active status - true', async() => {
      // Act
      const result = await sut.execute({ active: true });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      result.data.forEach(shipper => {
        expect(shipper.active).toBe(true);
      });
    });

    it('should filter by active status - false', async() => {
      // Act
      const result = await sut.execute({ active: false });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Integration tests - Case insensitive filters', () => {
    it('should handle case insensitive search for companyName', async() => {
      // Act
      const result = await sut.execute({ companyName: 'ALPHA' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companyName).toBe('Alpha Express Transportes Ltd');
    });

    it('should handle case insensitive search for fantasyName', async() => {
      // Act
      const result = await sut.execute({ fantasyName: 'LOGISTICS' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].fantasyName).toBe('Beta Logistics');
    });

    it('should handle case insensitive search for representative', async() => {
      // Act
      const result = await sut.execute({ representative: 'JANE' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].representative).toBe('Jane Beta Santos');
    });

    it('should handle case insensitive search for address', async() => {
      // Act
      const result = await sut.execute({ address: 'GAMMA ROAD' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].street).toBe('Gamma Road');
    });
  });

  describe('Integration tests - Combined filters', () => {
    it('should filter by companyName AND representative', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Beta', representative: 'Santos' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Beta');
      expect(result.data[0].representative).toContain('Santos');
    });

    it('should filter by multiple string fields', async() => {
      // Act
      const result = await sut.execute({
        companyName: 'Shipping',
        fantasyName: 'Foxtrot',
        representative: 'Silva',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Shipping');
      expect(result.data[0].fantasyName).toContain('Foxtrot');
      expect(result.data[0].representative).toContain('Silva');
    });

    it('should return empty when filters do not match any shipper', async() => {
      // Act
      const result = await sut.execute({ companyName: 'NonExistent', representative: 'Nobody' });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should filter by exact CNPJ AND contact', async() => {
      // Act
      const result = await sut.execute({
        cnpj: '33651573000134',
        contact: '94444',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('33651573000134');
      expect(result.data[0].contact).toContain('94444');
    });

    it('should filter by fantasyName AND address', async() => {
      // Act
      const result = await sut.execute({
        fantasyName: 'Epsilon',
        address: 'Porto Alegre',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fantasyName).toContain('Epsilon');
      expect(result.data[0].city).toBe('Porto Alegre');
    });
  });

  describe('Integration tests - Pagination with filters', () => {
    it('should combine pagination with companyName filter', async() => {
      // Arrange - Create more shippers with similar names
      await createShipper.execute({
        ...baseShipperData,
        cnpj: '51972498000195',
        companyName: 'Alpha Transport 2',
        fantasyName: 'Alpha 2',
        representative: 'Test Rep',
        companyIds: [],
      });
      await createShipper.execute({
        ...baseShipperData,
        cnpj: '90910555000163',
        companyName: 'Alpha Transport 3',
        fantasyName: 'Alpha 3',
        representative: 'Test Rep 2',
        companyIds: [],
      });

      // Act
      const result = await sut.execute({ companyName: 'Alpha', page: 1, size: 2 });

      // Assert
      expect(result.totalItems).toBe(3); // Total Alpha shippers
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should combine pagination with multiple filters', async() => {
      // Act
      const result = await sut.execute({ representative: 'Silva', page: 1, size: 1 });

      // Assert
      expect(result.totalItems).toBe(1); // Total shippers with Silva
      expect(result.data).toHaveLength(1); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle pagination beyond available results', async() => {
      // Act
      const result = await sut.execute({ fantasyName: 'Gamma', page: 3, size: 2 });

      // Assert
      expect(result.totalItems).toBe(1); // Total Gamma shippers
      expect(result.data).toHaveLength(0); // No results on page 3
      expect(result.currentPage).toBe(3);
    });
  });

  describe('Integration tests - Edge cases', () => {
    it('should return empty result when filtering by non-existent value', async() => {
      // Act
      const result = await sut.execute({ companyName: 'NonExistentCompany' });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should handle empty string filters', async() => {
      // Act
      const result = await sut.execute({ companyName: '', fantasyName: '' });

      // Assert
      expect(result.totalItems).toBe(6); // Should return all shippers
      expect(result.data).toHaveLength(6);
    });

    it('should handle undefined filters mixed with valid ones', async() => {
      // Act
      const result = await sut.execute({
        companyName: 'Beta',
        fantasyName: undefined,
        representative: undefined,
      });

      // Assert
      expect(result.totalItems).toBe(1); // Beta shippers
      expect(result.data).toHaveLength(1);
    });

    it('should handle partial matches correctly', async() => {
      // Act
      const result = await sut.execute({ representative: 'Alpha' });

      // Assert
      expect(result.totalItems).toBeGreaterThan(0);
      result.data.forEach(shipper => {
        expect(shipper.representative).toContain('Alpha');
      });
    });
  });

  describe('Integration tests - Filter by companyIds', () => {
    it('should filter by single companyId - Company 1', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId1] });

      // Assert
      expect(result.totalItems).toBe(3); // shippers 2, 3, 6 (have Company 1)
      expect(result.data).toHaveLength(3);

      const shipperIds = result.data.map(s => s.id).sort();
      const expectedIds = [createdShipperIds[1], createdShipperIds[2], createdShipperIds[5]].sort();
      expect(shipperIds).toEqual(expectedIds);

      // Verify each shipper has Company 1
      result.data.forEach(shipper => {
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(companyId1);
      });
    });

    it('should filter by single companyId - Company 2', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId2] });

      // Assert
      expect(result.totalItems).toBe(3); // shippers 3, 4, 6 (have Company 2)
      expect(result.data).toHaveLength(3);

      const shipperIds = result.data.map(s => s.id).sort();
      const expectedIds = [createdShipperIds[2], createdShipperIds[3], createdShipperIds[5]].sort();
      expect(shipperIds).toEqual(expectedIds);

      // Verify each shipper has Company 2
      result.data.forEach(shipper => {
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(companyId2);
      });
    });

    it('should filter by single companyId - Company 3', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId3] });

      // Assert
      expect(result.totalItems).toBe(2); // shippers 5, 6 (have Company 3)
      expect(result.data).toHaveLength(2);

      const shipperIds = result.data.map(s => s.id).sort();
      const expectedIds = [createdShipperIds[4], createdShipperIds[5]].sort();
      expect(shipperIds).toEqual(expectedIds);

      // Verify each shipper has Company 3
      result.data.forEach(shipper => {
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(companyId3);
      });
    });

    it('should filter by multiple companyIds - Companies 1 and 2', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId1, companyId2] });

      // Assert
      expect(result.totalItems).toBe(4); // shippers 2, 3, 4, 6 (have Company 1 OR 2)
      expect(result.data).toHaveLength(4);

      const shipperIds = result.data.map(s => s.id).sort();
      const expectedIds = [
        createdShipperIds[1],
        createdShipperIds[2],
        createdShipperIds[3],
        createdShipperIds[5],
      ].sort();
      expect(shipperIds).toEqual(expectedIds);
    });

    it('should filter by multiple companyIds - Companies 2 and 3', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId2, companyId3] });

      // Assert
      expect(result.totalItems).toBe(4); // shippers 3, 4, 5, 6 (have Company 2 OR 3)
      expect(result.data).toHaveLength(4);

      const shipperIds = result.data.map(s => s.id).sort();
      const expectedIds = [
        createdShipperIds[2],
        createdShipperIds[3],
        createdShipperIds[4],
        createdShipperIds[5],
      ].sort();
      expect(shipperIds).toEqual(expectedIds);
    });

    it('should filter by all companyIds', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId1, companyId2, companyId3] });

      // Assert
      expect(result.totalItems).toBe(5); // All shippers except shipper 1 (which has no companies)
      expect(result.data).toHaveLength(5);

      const shipperIds = result.data.map(s => s.id).sort();
      const expectedIds = [
        createdShipperIds[1],
        createdShipperIds[2],
        createdShipperIds[3],
        createdShipperIds[4],
        createdShipperIds[5],
      ].sort();
      expect(shipperIds).toEqual(expectedIds);
    });

    it('should return empty when filtering by non-existent companyId', async() => {
      // Act
      const result = await sut.execute({ companyIds: ['non-existent-company-id'] });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should return all shippers when companyIds is empty array', async() => {
      // Act
      const result = await sut.execute({ companyIds: [] });

      // Assert
      expect(result.totalItems).toBe(6); // Should return all shippers (empty array is ignored)
      expect(result.data).toHaveLength(6);
    });

    it('should combine companyIds filter with companyName filter', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId1],
        companyName: 'Gamma',
      });

      // Assert
      expect(result.totalItems).toBe(1); // Only shipper 3 (has Company 1 AND Gamma in name)
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(createdShipperIds[2]);
      expect(result.data[0].companyName).toContain('Gamma');
    });

    it('should combine companyIds filter with fantasyName filter', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId2],
        fantasyName: 'Gamma',
      });

      // Assert
      expect(result.totalItems).toBe(1); // Only shipper 3 (has Company 2 AND Gamma fantasy name)
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(createdShipperIds[2]);
      expect(result.data[0].fantasyName).toContain('Gamma');
    });

    it('should combine companyIds filter with active filter', async() => {
      // Arrange - First, deactivate one shipper
      const shipperToDeactivate = await prisma.shipper.findUnique({
        where: { id: createdShipperIds[1] },
      });
      await prisma.shipper.update({
        where: { id: createdShipperIds[1] },
        data: { active: !shipperToDeactivate!.active },
      });

      // Act
      const result = await sut.execute({
        companyIds: [companyId1],
        active: true,
      });

      // Assert
      expect(result.totalItems).toBe(2); // shippers 3, 6 (have Company 1 AND active)
      expect(result.data).toHaveLength(2);

      result.data.forEach(shipper => {
        expect(shipper.active).toBe(true);
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(companyId1);
      });

      // Cleanup - restore original state
      await prisma.shipper.update({
        where: { id: createdShipperIds[1] },
        data: { active: !shipperToDeactivate!.active },
      });
    });

    it('should combine companyIds with multiple string filters', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId1, companyId2],
        fantasyName: 'Gamma',
        representative: 'Wilson',
      });

      // Assert
      expect(result.totalItems).toBe(1); // Only shipper 3 (has Company 1/2, Gamma, and Wilson)
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(createdShipperIds[2]);
    });

    it('should return empty when companyIds filter does not match with other filters', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId3],
        fantasyName: 'Alpha',
      });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should combine pagination with companyIds filter', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId1],
        page: 1,
        size: 2,
      });

      // Assert
      expect(result.totalItems).toBe(3); // Total shippers with Company 1
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should combine pagination with multiple companyIds', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId2, companyId3],
        page: 2,
        size: 2,
      });

      // Assert
      expect(result.totalItems).toBe(4); // shippers 3, 4, 5, 6 (have Company 2 or 3)
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should verify correct companies are returned when filtering by companyIds', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId2] });

      // Assert
      expect(result.totalItems).toBe(3); // shippers 3, 4, 6

      // Verify each shipper has Company 2 in their companies array
      result.data.forEach(shipper => {
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(companyId2);
        expect(shipper.companies.some(c => c.id === companyId2)).toBe(true);
      });
    });

    it('should handle companyIds filter with pagination beyond results', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId3],
        page: 5,
        size: 2,
      });

      // Assert
      expect(result.totalItems).toBe(2); // Total shippers with Company 3
      expect(result.data).toHaveLength(0); // No results on page 5
      expect(result.currentPage).toBe(5);
    });
  });

  describe('Integration tests - Company associations', () => {
    it('should return shippers with empty companies array', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const shippersWithNoCompanies = result.data.filter(s => s.companies.length === 0);
      expect(shippersWithNoCompanies).toHaveLength(1); // Only shipper 1 has no companies
      expect(shippersWithNoCompanies[0].id).toBe(createdShipperIds[0]);
    });

    it('should return shippers with companies array populated', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const shippersWithCompanies = result.data.filter(s => s.companies.length > 0);
      expect(shippersWithCompanies).toHaveLength(5); // Shippers 2, 3, 4, 5, 6 have companies
    });

    it('should return shipper with single company association', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Beta Logistics' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(1);
      expect(result.data[0].companies[0].id).toBe(companyId1);
      expect(result.data[0].companies[0].name).toBe('Test Company 1');
    });

    it('should return shipper with multiple company associations', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Gamma Corporation' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(2);
      const companyIds = result.data[0].companies.map(c => c.id);
      expect(companyIds).toContain(companyId1);
      expect(companyIds).toContain(companyId2);
    });

    it('should return shipper with all companies associated', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Foxtrot Shipping' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(3);
      const companyIds = result.data[0].companies.map(c => c.id);
      expect(companyIds).toContain(companyId1);
      expect(companyIds).toContain(companyId2);
      expect(companyIds).toContain(companyId3);
    });

    it('should return correct company names and ids in companies array', async() => {
      // Act
      const result = await sut.execute({ representative: 'Maria Delta Costa' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(1);
      expect(result.data[0].companies[0]).toEqual({
        id: companyId2,
        name: 'Test Company 2',
      });
    });

    it('should return all shippers and verify companies array structure', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(6);

      // Verify each shipper has companies array
      result.data.forEach(shipper => {
        expect(shipper).toHaveProperty('companies');
        expect(Array.isArray(shipper.companies)).toBe(true);

        // Verify each company in the array has correct structure
        shipper.companies.forEach(company => {
          expect(company).toHaveProperty('id');
          expect(company).toHaveProperty('name');
          expect(typeof company.id).toBe('string');
          expect(typeof company.name).toBe('string');
        });
      });
    });

    it('should verify specific shipper company associations', async() => {
      // Act
      const result = await sut.execute({});

      // Assert - Verify specific shippers have correct number of companies
      const shipper1 = result.data.find(s => s.id === createdShipperIds[0]);
      const shipper2 = result.data.find(s => s.id === createdShipperIds[1]);
      const shipper3 = result.data.find(s => s.id === createdShipperIds[2]);
      const shipper4 = result.data.find(s => s.id === createdShipperIds[3]);
      const shipper5 = result.data.find(s => s.id === createdShipperIds[4]);
      const shipper6 = result.data.find(s => s.id === createdShipperIds[5]);

      expect(shipper1?.companies).toHaveLength(0); // No companies
      expect(shipper2?.companies).toHaveLength(1); // Company 1
      expect(shipper3?.companies).toHaveLength(2); // Companies 1, 2
      expect(shipper4?.companies).toHaveLength(1); // Company 2
      expect(shipper5?.companies).toHaveLength(1); // Company 3
      expect(shipper6?.companies).toHaveLength(3); // Companies 1, 2, 3
    });

    it('should handle pagination with companies array', async() => {
      // Act
      const result = await sut.execute({ page: 1, size: 3 });

      // Assert
      expect(result.data).toHaveLength(3);
      result.data.forEach(shipper => {
        expect(shipper).toHaveProperty('companies');
        expect(Array.isArray(shipper.companies)).toBe(true);
      });
    });
  });
});
