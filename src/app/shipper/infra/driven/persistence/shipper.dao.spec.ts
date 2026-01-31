import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { ShipperPersistenceModule } from 'src/app/shipper/application/persistence/shipper-persistence.module';
import { FindAllShipperQueryDto } from 'src/app/shipper/application/usecases/find-all-shipper/dtos/find-all-shipper.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDaoAdapterPrisma } from './shipper.dao';

describe('ShipperDaoAdapterPrisma', () => {
  let sut: ShipperDaoAdapterPrisma;
  let prisma: PrismaService;
  let testShipperIds: string[] = [];
  let company1: Company;
  let company2: Company;
  let company3: Company;

  const createTestShippers = async(): Promise<void> => {
    const shippers = [
      // Shipper 1: No companies
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
        active: true,
      },
      // Shipper 2: Company A
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
        active: true,
        companies: { connect: { id: company1.id } },
      },
      // Shipper 3: Companies A and B
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
        active: true,
        companies: { connect: [{ id: company1.id }, { id: company2.id }] },
      },
      // Shipper 4: Company B
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
        active: true,
        companies: { connect: { id: company2.id } },
      },
      // Shipper 5: Company C - INACTIVE
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
        active: false,
        companies: { connect: { id: company3.id } },
      },
      // Shipper 6: All companies
      {
        companyName: 'Transportadora Zeta Ltda',
        fantasyName: 'Zeta Fast',
        cnpj: '66666666000666',
        contact: 'Rafael Santos',
        representative: 'Beatriz Silva',
        zipCode: '06666666',
        street: 'Rua Zeta',
        number: '666',
        complement: 'Centro de Distribuição',
        reference: 'Ao lado da BR-101',
        neighborhood: 'Zeta District',
        city: 'Campinas',
        state: 'SP',
        active: true,
        companies: { connect: [{ id: company1.id }, { id: company2.id }, { id: company3.id }] },
      },
    ];

    testShipperIds = [];
    for (const shipper of shippers) {
      const created = await prisma.shipper.create({ data: shipper });
      testShipperIds.push(created.id);
    }
  };

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ShipperPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ShipperDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ShipperDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();

    // Create test companies
    company1 = await prisma.company.create({
      data: {
        name: 'Company A',
        fantasyName: 'Company A Fantasy',
        document: '11111111000101',
        ie: 'IE-A',
        zipCode: '11111111',
        street: 'Street A',
        number: '100',
        neighborhood: 'District A',
        city: 'City A',
        state: 'CA',
        phone01: '1111111111',
        email01: 'companyA@test.com',
        active: true,
      },
    });

    company2 = await prisma.company.create({
      data: {
        name: 'Company B',
        fantasyName: 'Company B Fantasy',
        document: '22222222000102',
        ie: 'IE-B',
        zipCode: '22222222',
        street: 'Street B',
        number: '200',
        neighborhood: 'District B',
        city: 'City B',
        state: 'CB',
        phone01: '2222222222',
        email01: 'companyB@test.com',
        active: true,
      },
    });

    company3 = await prisma.company.create({
      data: {
        name: 'Company C',
        fantasyName: 'Company C Fantasy',
        document: '33333333000103',
        ie: 'IE-C',
        zipCode: '33333333',
        street: 'Street C',
        number: '300',
        neighborhood: 'District C',
        city: 'City C',
        state: 'CC',
        phone01: '3333333333',
        email01: 'companyC@test.com',
        active: true,
      },
    });

    await createTestShippers();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findById', () => {
    it('should find shipper by id', async() => {
      // Act
      const result = await sut.findById(testShipperIds[0]);

      // Assert
      expect(result).toBeDefined();
      expect(result?.companyName).toBe('Transportadora Alpha Ltda');
      expect(result?.cnpj).toBe('11111111000111');
      expect(result?.companies).toEqual([]);
    });

    it('should return null for non-existent id', async() => {
      // Act
      const result = await sut.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return shipper with companies', async() => {
      // Act
      const result = await sut.findById(testShipperIds[1]); // Beta has Company A

      // Assert
      expect(result).toBeDefined();
      expect(result?.companies).toHaveLength(1);
      expect(result?.companies[0].id).toBe(company1.id);
      expect(result?.companies[0].name).toBe('Company A');
    });

    it('should return shipper with multiple companies', async() => {
      // Act
      const result = await sut.findById(testShipperIds[5]); // Zeta has all companies

      // Assert
      expect(result).toBeDefined();
      expect(result?.companies).toHaveLength(3);
      const companyIds = result?.companies.map(c => c.id);
      expect(companyIds).toContain(company1.id);
      expect(companyIds).toContain(company2.id);
      expect(companyIds).toContain(company3.id);
    });
  });

  describe('findByCnpj', () => {
    it('should find shipper by cnpj', async() => {
      // Act
      const result = await sut.findByCnpj('22222222000222');

      // Assert
      expect(result).toBeDefined();
      expect(result?.companyName).toBe('Transportadora Beta Ltda');
      expect(result?.cnpj).toBe('22222222000222');
      expect(result?.companies).toHaveLength(1);
      expect(result?.companies[0].id).toBe(company1.id);
    });

    it('should return null for non-existent cnpj', async() => {
      // Act
      const result = await sut.findByCnpj('99999999000999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll - pagination tests', () => {
    it('should return all shippers when no pagination is specified', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {};

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(6);
      expect(total).toBe(6);
    });

    it('should handle first page pagination', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { page: 1, size: 2 };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(2);
      expect(total).toBe(6);
    });

    it('should handle middle page pagination', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { page: 2, size: 2 };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(2);
      expect(total).toBe(6);
    });

    it('should handle last page pagination with partial results', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { page: 3, size: 2 };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(2);
      expect(total).toBe(6);
    });

    it('should return empty page when page exceeds total pages', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { page: 10, size: 2 };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(6);
    });

    it('should handle large page size', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { page: 1, size: 100 };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(6);
      expect(total).toBe(6);
    });

    it('should maintain order by createdAt desc', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { page: 1, size: 3 };

      // Act
      const [shippers] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(3);
      // Shippers should be ordered by createdAt desc (newest first)
      for (let i = 0; i < shippers.length - 1; i++) {
        expect(shippers[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          shippers[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe('findAll - companyName filter tests', () => {
    it('should filter by companyName (case insensitive)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyName: 'alpha' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].companyName.toLowerCase()).toContain('alpha');
    });

    it('should filter by partial companyName match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyName: 'Trans' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(6);
      expect(total).toBe(6);
      shippers.forEach(shipper => {
        expect(shipper.companyName.toLowerCase()).toContain('transportadora');
      });
    });

    it('should return empty when companyName does not match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyName: 'NonExistent' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('should filter by exact companyName', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyName: 'Transportadora Beta Ltda' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].companyName).toBe('Transportadora Beta Ltda');
    });
  });

  describe('findAll - fantasyName filter tests', () => {
    it('should filter by fantasyName', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { fantasyName: 'Beta' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].fantasyName).toContain('Beta');
    });

    it('should filter by partial fantasyName match (case insensitive)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { fantasyName: 'express' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].fantasyName.toLowerCase()).toContain('express');
    });

    it('should find multiple matches for partial fantasyName', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { fantasyName: 'a' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(1);
      expect(total).toBeGreaterThan(1);
      shippers.forEach(shipper => {
        expect(shipper.fantasyName.toLowerCase()).toContain('a');
      });
    });
  });

  describe('findAll - cnpj filter tests', () => {
    it('should filter by cnpj', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { cnpj: '44444444000444' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].cnpj).toBe('44444444000444');
    });

    it('should filter by partial cnpj match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { cnpj: '5555' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].cnpj).toContain('5555');
    });

    it('should return empty when cnpj does not match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { cnpj: '99999999000999' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('should filter by cnpj prefix', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { cnpj: '111' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].cnpj).toContain('111');
    });
  });

  describe('findAll - contact filter tests', () => {
    it('should filter by contact (case insensitive)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { contact: 'joão' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].contact.toLowerCase()).toContain('joão');
    });

    it('should filter by partial contact match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { contact: 'Silva' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].contact).toContain('Silva');
    });

    it('should find multiple matches for common contact names', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { contact: 'a' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(1);
      expect(total).toBeGreaterThan(1);
      shippers.forEach(shipper => {
        expect(shipper.contact.toLowerCase()).toContain('a');
      });
    });

    it('should return empty when contact does not match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { contact: 'NonExistentContact' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  describe('findAll - representative filter tests', () => {
    it('should filter by representative (case insensitive)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { representative: 'maria' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].representative.toLowerCase()).toContain('maria');
    });

    it('should filter by partial representative match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { representative: 'Santos' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].representative).toContain('Santos');
    });

    it('should find multiple matches for common representative names', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { representative: 'Silva' };

      // Act
      const [shippers] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(0);
      shippers.forEach(shipper => {
        expect(shipper.representative.toLowerCase()).toContain('silva');
      });
    });
  });

  describe('findAll - address filter tests', () => {
    it('should filter by zipCode in address', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: '01111111' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].zipCode).toBe('01111111');
    });

    it('should filter by street in address', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: 'Avenida Beta' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].street).toContain('Avenida Beta');
    });

    it('should filter by number in address', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: '333' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].number).toBe('333');
    });

    it('should filter by neighborhood in address', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: 'Delta Park' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].neighborhood).toContain('Delta Park');
    });

    it('should filter by city in address (case insensitive)', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: 'curitiba' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].city.toLowerCase()).toBe('curitiba');
    });

    it('should filter by state in address', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: 'SP' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(1);
      expect(total).toBeGreaterThan(1);
      shippers.forEach(shipper => {
        expect(shipper.state).toBe('SP');
      });
    });

    it('should find by partial address match in multiple fields', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: 'Rua' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(1);
      expect(total).toBeGreaterThan(1);
      shippers.forEach(shipper => {
        const hasMatchInAddress =
          shipper.street?.toLowerCase().includes('rua') ||
          shipper.neighborhood?.toLowerCase().includes('rua') ||
          shipper.city?.toLowerCase().includes('rua');
        expect(hasMatchInAddress).toBe(true);
      });
    });

    it('should return empty when address does not match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { address: 'NonExistentAddress' };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  describe('findAll - combined filters tests', () => {
    it('should filter by companyName and city', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'Alpha',
        address: 'São Paulo',
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].companyName).toContain('Alpha');
      expect(shippers[0].city).toBe('São Paulo');
    });

    it('should filter by fantasyName and state', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        fantasyName: 'Delta',
        address: 'SP',
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].fantasyName).toContain('Delta');
      expect(shippers[0].state).toBe('SP');
    });

    it('should filter by contact and representative', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        contact: 'João',
        representative: 'Maria',
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].contact).toContain('João');
      expect(shippers[0].representative).toContain('Maria');
    });

    it('should apply pagination with filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        address: 'SP',
        page: 1,
        size: 2,
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(2);
      expect(total).toBe(3); // Alpha, Delta, and Zeta are in SP
      shippers.forEach(shipper => {
        expect(shipper.state).toBe('SP');
      });
    });

    it('should return empty when combined filters do not match', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'Alpha',
        address: 'RJ', // Alpha is in SP, not RJ
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('should filter by all available filters at once', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: 'Transportadora',
        fantasyName: 'Express',
        contact: 'João',
        representative: 'Maria',
        address: 'São Paulo',
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].companyName).toContain('Transportadora');
      expect(shippers[0].fantasyName).toContain('Express');
      expect(shippers[0].contact).toContain('João');
      expect(shippers[0].representative).toContain('Maria');
      expect(shippers[0].city).toBe('São Paulo');
    });
  });

  describe('findAll - edge cases and special scenarios', () => {
    it('should handle empty string filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyName: '',
        fantasyName: '',
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(6);
      expect(total).toBe(6);
    });

    it('should maintain correct total count across different page sizes', async() => {
      // Arrange
      const queries1: FindAllShipperQueryDto = { page: 1, size: 2 };
      const queries2: FindAllShipperQueryDto = { page: 1, size: 3 };

      // Act
      const [, total1] = await sut.findAll(queries1);
      const [, total2] = await sut.findAll(queries2);

      // Assert
      expect(total1).toBe(6);
      expect(total2).toBe(6);
    });

    it('should return consistent results with multiple sequential calls', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyName: 'Beta' };

      // Act
      const [shippers1] = await sut.findAll(queries);
      const [shippers2] = await sut.findAll(queries);

      // Assert
      expect(shippers1).toHaveLength(shippers2.length);
      expect(shippers1[0].id).toBe(shippers2[0].id);
    });
  });

  describe('findAll - active filter tests', () => {
    it('should filter by active status - true', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { active: true };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(5); // All except Epsilon
      expect(total).toBe(5);
      shippers.forEach(shipper => {
        expect(shipper.active).toBe(true);
      });
    });

    it('should filter by active status - false', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { active: false };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1); // Only Epsilon
      expect(total).toBe(1);
      expect(shippers[0].companyName).toBe('Transportadora Epsilon Ltda');
      expect(shippers[0].active).toBe(false);
    });

    it('should return all shippers when active filter is not provided', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {};

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(6);
      expect(total).toBe(6);
    });

    it('should combine active filter with other filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        active: true,
        address: 'SP',
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(0);
      expect(total).toBeGreaterThan(0);
      shippers.forEach(shipper => {
        expect(shipper.active).toBe(true);
        expect(shipper.state).toBe('SP');
      });
    });

    it('should combine active=false with pagination', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        active: false,
        page: 1,
        size: 10,
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1);
      expect(total).toBe(1);
      expect(shippers[0].active).toBe(false);
    });
  });

  describe('findAll - companyIds filter tests', () => {
    it('should filter by single companyId - Company A', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyIds: [company1.id] };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(3); // Beta, Gamma, Zeta have Company A
      expect(total).toBe(3);
      shippers.forEach(shipper => {
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(company1.id);
      });
    });

    it('should filter by single companyId - Company B', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyIds: [company2.id] };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(3); // Gamma, Delta, Zeta have Company B
      expect(total).toBe(3);
      shippers.forEach(shipper => {
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(company2.id);
      });
    });

    it('should filter by single companyId - Company C', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyIds: [company3.id] };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(2); // Epsilon, Zeta have Company C
      expect(total).toBe(2);
      shippers.forEach(shipper => {
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(company3.id);
      });
    });

    it('should filter by multiple companyIds - Companies A and B', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company1.id, company2.id],
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(4); // Beta, Gamma, Delta, Zeta (have Company A OR B)
      expect(total).toBe(4);
    });

    it('should filter by multiple companyIds - Companies B and C', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company2.id, company3.id],
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(4); // Gamma, Delta, Epsilon, Zeta (have Company B OR C)
      expect(total).toBe(4);
    });

    it('should filter by all companyIds', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company1.id, company2.id, company3.id],
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(5); // All except Alpha (which has no companies)
      expect(total).toBe(5);
    });

    it('should return empty when filtering by non-existent companyId', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: ['non-existent-company-id'],
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('should return all shippers when companyIds is empty array', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyIds: [] };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(6); // Should return all shippers (empty array is ignored)
      expect(total).toBe(6);
    });

    it('should combine companyIds filter with companyName filter', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company1.id],
        companyName: 'Beta',
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1); // Only Beta (has Company A AND name matches)
      expect(total).toBe(1);
      expect(shippers[0].companyName).toBe('Transportadora Beta Ltda');
    });

    it('should combine companyIds filter with address filter', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company2.id],
        address: 'SP',
      };

      // Act
      const [shippers] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(0);
      shippers.forEach(shipper => {
        expect(shipper.state).toBe('SP');
        const companyIds = shipper.companies.map(c => c.id);
        expect(companyIds).toContain(company2.id);
      });
    });

    it('should combine companyIds with active filter', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company3.id],
        active: true,
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(1); // Only Zeta (Epsilon is inactive)
      expect(total).toBe(1);
      expect(shippers[0].companyName).toBe('Transportadora Zeta Ltda');
      expect(shippers[0].active).toBe(true);
    });

    it('should combine companyIds with pagination', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company1.id],
        page: 1,
        size: 2,
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(2); // Page size
      expect(total).toBe(3); // Total shippers with Company A
    });

    it('should verify correct companies are returned in results', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = { companyIds: [company2.id] };

      // Act
      const [shippers] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(3);
      shippers.forEach(shipper => {
        const company2Data = shipper.companies.find(c => c.id === company2.id);
        expect(company2Data).toBeDefined();
        expect(company2Data?.name).toBe('Company B');
      });
    });

    it('should return empty when companyIds filter does not match with other filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company3.id],
        companyName: 'Alpha', // Alpha has no companies
      };

      // Act
      const [shippers, total] = await sut.findAll(queries);

      // Assert
      expect(shippers).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('should handle companyIds filter with multiple filters', async() => {
      // Arrange
      const queries: FindAllShipperQueryDto = {
        companyIds: [company1.id, company2.id],
        active: true,
        address: 'SP',
      };

      // Act
      const [shippers] = await sut.findAll(queries);

      // Assert
      expect(shippers.length).toBeGreaterThan(0);
      shippers.forEach(shipper => {
        expect(shipper.active).toBe(true);
        expect(shipper.state).toBe('SP');
      });
    });
  });
});
