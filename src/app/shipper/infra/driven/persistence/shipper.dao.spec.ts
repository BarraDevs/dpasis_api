import { Test } from '@nestjs/testing';
import { ShipperDto } from 'src/app/shipper/application/dtos/shipper.dto';
import { ShipperPersistenceModule } from 'src/app/shipper/application/persistence/shipper-persistence.module';
import { CreateShipperInputDto } from 'src/app/shipper/application/usecases/create-shipper/dtos/create-shipper.dto';
import { EditShipperInputDto } from 'src/app/shipper/application/usecases/edit-shipper/dtos/edit-shipper.dto';
import { FindAllShipperQueryDto } from 'src/app/shipper/application/usecases/find-all-shipper/dtos/find-all-shipper.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDaoAdapterPrisma } from './shipper.dao';

describe('ShipperDaoAdapterPrisma', () => {
  let sut: ShipperDaoAdapterPrisma;
  let prisma: PrismaService;
  let testShipperIds: string[] = [];

  const createTestShippers = async(): Promise<void> => {
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
      },
    ];

    testShipperIds = [];
    for (const shipper of shippers) {
      const id = await sut.save(shipper);
      testShipperIds.push(id);
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

    await prisma.shipper.deleteMany();
    await createTestShippers();
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save a new shipper and return its id', async() => {
      // Arrange
      const newShipper: CreateShipperInputDto = {
        companyName: 'Nova Transportadora Ltda',
        fantasyName: 'Nova Trans',
        cnpj: '99999999000999',
        contact: 'Novo Contato',
        representative: 'Novo Representante',
        zipCode: '09999999',
        street: 'Nova Rua',
        number: '999',
        complement: null,
        reference: null,
        neighborhood: 'Novo Bairro',
        city: 'Nova Cidade',
        state: 'NC',
      };

      // Act
      const id = await sut.save(newShipper);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const saved = await prisma.shipper.findUnique({ where: { id } });
      expect(saved).toBeDefined();
      expect(saved).toEqual<ShipperDto>({
        id,
        companyName: newShipper.companyName,
        fantasyName: newShipper.fantasyName,
        cnpj: newShipper.cnpj,
        contact: newShipper.contact,
        representative: newShipper.representative,
        zipCode: newShipper.zipCode,
        street: newShipper.street,
        number: newShipper.number,
        complement: newShipper.complement,
        reference: newShipper.reference,
        neighborhood: newShipper.neighborhood,
        city: newShipper.city,
        state: newShipper.state,
        createdAt: saved!.createdAt,
        updatedAt: saved!.updatedAt,
      });
    });

    it('should save shipper with optional fields as null', async() => {
      // Arrange
      const shipper: CreateShipperInputDto = {
        companyName: 'Transportadora Minimal Ltda',
        fantasyName: 'Minimal',
        cnpj: '88888888000888',
        contact: 'Contato Minimal',
        representative: 'Rep Minimal',
        zipCode: '08888888',
        street: 'Rua Minimal',
        number: '888',
        complement: null,
        reference: null,
        neighborhood: 'Bairro Minimal',
        city: 'Cidade Minimal',
        state: 'MN',
      };

      // Act
      const id = await sut.save(shipper);

      // Assert
      const saved = await prisma.shipper.findUnique({ where: { id } });
      expect(saved).toBeDefined();
      expect(saved).toEqual<ShipperDto>({
        ...shipper,
        complement: null,
        reference: null,
        id,
        createdAt: saved!.createdAt,
        updatedAt: saved!.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should find shipper by id', async() => {
      // Act
      const result = await sut.findById(testShipperIds[0]);

      // Assert
      expect(result).toBeDefined();
      expect(result?.companyName).toBe('Transportadora Alpha Ltda');
      expect(result?.cnpj).toBe('11111111000111');
    });

    it('should return null for non-existent id', async() => {
      // Act
      const result = await sut.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
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
    });

    it('should return null for non-existent cnpj', async() => {
      // Act
      const result = await sut.findByCnpj('99999999000999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('edit', () => {
    it('should update shipper successfully', async() => {
      // Arrange
      const updateData: EditShipperInputDto = {
        companyName: 'Transportadora Alpha Atualizada Ltda',
        contact: 'João Silva Atualizado',
      };

      // Act
      await sut.edit(testShipperIds[0], updateData);

      // Assert
      const updated = await prisma.shipper.findUnique({ where: { id: testShipperIds[0] } });
      expect(updated?.companyName).toBe('Transportadora Alpha Atualizada Ltda');
      expect(updated?.contact).toBe('João Silva Atualizado');
      expect(updated?.cnpj).toBe('11111111000111'); // Should remain unchanged
    });

    it('should update only provided fields', async() => {
      // Arrange
      const originalShipper = await prisma.shipper.findUnique({ where: { id: testShipperIds[0] } });
      const updateData: EditShipperInputDto = { companyName: 'Only Company Name Updated' };

      // Act
      await sut.edit(testShipperIds[0], updateData);

      // Assert
      const updated = await prisma.shipper.findUnique({ where: { id: testShipperIds[0] } });
      expect(updated?.companyName).toBe('Only Company Name Updated');
      expect(updated?.fantasyName).toBe(originalShipper?.fantasyName);
      expect(updated?.cnpj).toBe(originalShipper?.cnpj);
    });

    it('should allow setting fields to null', async() => {
      // Arrange
      const updateData: EditShipperInputDto = {
        complement: null,
        reference: null,
      };

      // Act
      await sut.edit(testShipperIds[0], updateData);

      // Assert
      const updated = await prisma.shipper.findUnique({ where: { id: testShipperIds[0] } });
      expect(updated?.complement).toBeNull();
      expect(updated?.reference).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete shipper successfully', async() => {
      // Act
      await sut.delete(testShipperIds[0]);

      // Assert
      const deleted = await prisma.shipper.findUnique({ where: { id: testShipperIds[0] } });
      expect(deleted).toBeNull();
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
});
