import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ShipperDto } from '../../dtos/shipper.dto';
import { CreateShipper } from '../create-shipper/create-shipper.service';
import { CreateShipperInputDto } from '../create-shipper/dtos/create-shipper.dto';
import { FindAllShipperQueryDto } from './dtos/find-all-shipper.dto';
import { FindAllShipper } from './find-all-shipper.service';

describe('FindAllShipper', () => {
  let sut: FindAllShipper;
  let prisma: PrismaService;
  let createShipper: CreateShipper;
  let testShippers: string[] = [];

  const createTestShippers = async() => {
    const shippers: CreateShipperInputDto[] = [
      {
        companyName: 'Transportadora Alpha Ltda',
        fantasyName: 'Alpha Express',
        cnpj: '11111111000111',
        contact: 'João Silva',
        representative: 'Maria Santos',
        zipCode: '01111111',
        street: 'Rua Alpha',
        number: '111',
        complement: 'Galpão 1',
        reference: 'Próximo ao terminal Alpha',
        neighborhood: 'Alpha District',
        city: 'São Paulo',
        state: 'SP',
      },
      {
        companyName: 'Transportadora Beta Ltda',
        fantasyName: 'Beta Logistics',
        cnpj: '22222222000222',
        contact: 'Pedro Oliveira',
        representative: 'Ana Costa',
        zipCode: '02222222',
        street: 'Avenida Beta',
        number: '222',
        complement: null,
        reference: null,
        neighborhood: 'Beta Center',
        city: 'Rio de Janeiro',
        state: 'RJ',
      },
      {
        companyName: 'Transportadora Gamma Ltda',
        fantasyName: 'Gamma Transport',
        cnpj: '33333333000333',
        contact: 'Carlos Ferreira',
        representative: 'Juliana Lima',
        zipCode: '03333333',
        street: 'Rua Gamma',
        number: '333',
        complement: 'Terminal 3',
        reference: 'Próximo à rodovia',
        neighborhood: 'Gamma Zone',
        city: 'Belo Horizonte',
        state: 'MG',
      },
      {
        companyName: 'Transportadora Delta Ltda',
        fantasyName: 'Delta Cargo',
        cnpj: '44444444000444',
        contact: 'Roberto Alves',
        representative: 'Fernanda Souza',
        zipCode: '04444444',
        street: 'Alameda Delta',
        number: '444',
        complement: 'Armazém D',
        reference: 'Em frente ao porto',
        neighborhood: 'Delta Park',
        city: 'Santos',
        state: 'SP',
      },
      {
        companyName: 'Transportadora Epsilon Ltda',
        fantasyName: 'Epsilon Speed',
        cnpj: '55555555000555',
        contact: 'Lucas Martins',
        representative: 'Patricia Rocha',
        zipCode: '05555555',
        street: 'Travessa Epsilon',
        number: '555',
        complement: null,
        reference: 'Próximo ao aeroporto',
        neighborhood: 'Epsilon Hills',
        city: 'Curitiba',
        state: 'PR',
      },
    ];

    testShippers = [];
    for (const shipper of shippers) {
      const result = await createShipper.execute(shipper);
      testShippers.push(result.id);
    }
  };

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

    // Clean database
    await prisma.shipper.deleteMany();

    // Create test shippers for integration tests
    await createTestShippers();
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call shipperDao.findAll with correct queries and return paginated result', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 1,
        size: 10,
        companyName: 'Test Shipper',
      };

      const mockShippers = createMock<ShipperDto>();
      const findAllSpy = jest.spyOn(sut['shipperDao'], 'findAll').mockResolvedValue([[mockShippers], 1]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual<IPagination<ShipperDto>>({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 1,
        totalPages: 1,
        data: [mockShippers],
      });
    });

    it('should handle empty result set', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 1,
        size: 10,
        companyName: 'Non-existent Shipper',
      };

      jest.spyOn(sut['shipperDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should correctly calculate pagination for multiple pages', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 2,
        size: 3,
      };

      const mockShippers: ShipperDto[] = Array.from({ length: 3 }, (_, i) => ({
        id: `${i + 4}`,
        companyName: `Transportadora ${i + 4}`,
        fantasyName: `Fantasy ${i + 4}`,
        cnpj: `${(i + 4).toString().repeat(8)}000${(i + 4).toString().repeat(3)}`,
        contact: `Contact ${i + 4}`,
        representative: `Rep ${i + 4}`,
        zipCode: `0${i + 4}${(i + 4).toString().repeat(6)}`,
        street: `Street ${i + 4}`,
        number: `${i + 4}00`,
        complement: null,
        reference: null,
        neighborhood: `District ${i + 4}`,
        city: 'São Paulo',
        state: 'SP',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      jest.spyOn(sut['shipperDao'], 'findAll').mockResolvedValue([mockShippers, 10]); // Total 10 items

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(3);
      expect(result.totalItems).toBe(10);
      expect(result.totalPages).toBe(4); // Math.ceil(10/3) = 4
      expect(result.data).toHaveLength(3);
    });
  });

  describe('integration tests - pagination', () => {
    it('should return all shippers when no pagination is specified', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {};

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(5); // Default to total when no size specified
      expect(result.totalPages).toBe(1);
    });

    it('should handle first page pagination correctly', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 1,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3); // Math.ceil(5/2) = 3
    });

    it('should handle middle page pagination correctly', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 2,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should handle last page pagination correctly', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 3,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1); // Last page has only 1 item
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(3);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty page when page number exceeds available pages', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 10,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(10);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should order results by createdAt descending', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        page: 1,
        size: 5,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(5);
      // Verify descending order
      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result.data[i + 1].createdAt.getTime(),
        );
      }
    });
  });

  describe('integration tests - filters', () => {
    it('should filter by companyName (partial match)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'Alpha',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toBe('Transportadora Alpha Ltda');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by fantasyName (partial match)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        fantasyName: 'Beta',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fantasyName).toBe('Beta Logistics');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by cnpj', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        cnpj: '33333333000333',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('33333333000333');
      expect(result.data[0].companyName).toContain('Gamma');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by contact', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        contact: 'Roberto',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].contact).toContain('Roberto');
      expect(result.data[0].companyName).toContain('Delta');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by representative', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        representative: 'Patricia',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].representative).toContain('Patricia');
      expect(result.data[0].companyName).toContain('Epsilon');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by address (street)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: 'Rua Alpha',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].street).toContain('Alpha');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by address (city)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: 'Belo Horizonte',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].city).toBe('Belo Horizonte');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by address (state)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: 'SP',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data.length).toBeGreaterThanOrEqual(2); // Alpha and Delta are in SP
      result.data.forEach(shipper => {
        expect(shipper.state).toBe('SP');
      });
    });

    it('should filter by address (zipCode)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: '02222222',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].zipCode).toBe('02222222');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by address (neighborhood)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: 'Delta Park',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].neighborhood).toContain('Delta Park');
      expect(result.totalItems).toBe(1);
    });

    it('should combine multiple filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'Alpha',
        address: 'SP',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Alpha');
      expect(result.data[0].state).toBe('SP');
      expect(result.totalItems).toBe(1);
    });

    it('should combine filters with pagination', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: 'SP', // Should match Alpha and Delta
        page: 1,
        size: 1,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(2); // Total matches for SP
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.data[0].state).toBe('SP');
    });

    it('should return empty result when no matches found', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'NonExistentShipper',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should filter by partial companyName (case insensitive)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'transportadora',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data.length).toBe(5); // All have "Transportadora"
      result.data.forEach(shipper => {
        expect(shipper.companyName.toLowerCase()).toContain('transportadora');
      });
    });

    it('should filter by partial cnpj', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        cnpj: '111',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toContain('111');
      expect(result.totalItems).toBe(1);
    });

    it('should combine companyName and fantasyName filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'Gamma',
        fantasyName: 'Transport',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Gamma');
      expect(result.data[0].fantasyName).toContain('Transport');
      expect(result.totalItems).toBe(1);
    });

    it('should combine contact and representative filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        contact: 'João',
        representative: 'Maria',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].contact).toContain('João');
      expect(result.data[0].representative).toContain('Maria');
      expect(result.totalItems).toBe(1);
    });

    it('should handle multiple address components', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: 'Rua',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(shipper => {
        const hasRua =
          shipper.street?.toLowerCase().includes('rua') ||
          shipper.neighborhood?.toLowerCase().includes('rua') ||
          shipper.city?.toLowerCase().includes('rua');
        expect(hasRua).toBe(true);
      });
    });
  });
});
