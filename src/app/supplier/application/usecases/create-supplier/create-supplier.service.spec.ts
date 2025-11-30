import { Test, TestingModule } from '@nestjs/testing';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierDto } from '../../dtos/supplier.dto';
import { FindSupplierById } from '../find-supplier-by-id/find-supplier-by-id.service';
import { CreateSupplier } from './create-supplier.service';
import { CreateSupplierInputDto, CreateSupplierOutputDto } from './dtos/create-supplier.dto';

describe('CreateSupplier', () => {
  let sut: CreateSupplier;
  let prisma: PrismaService;
  let findSupplierById: FindSupplierById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateSupplier);
    prisma = module.get(PrismaService);
    findSupplierById = module.get(FindSupplierById);

    await prisma.supplier.deleteMany();
  });

  afterEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call supplierDao.findByCnpj and supplierRepository.save with correct values', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '55.967.002/0001-46',
        ie: '123456789',
        group: 'Test Group',
        type: 'Test Type',
        companyName: 'Test Supplier Ltd',
        fantasyName: 'Test Supplier',
        representative: 'John Doe',
      };

      const findByCnpjSpy = jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(createData);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledWith('55967002000146'); // Sanitized CNPJ
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          cnpj: '55967002000146',
          ie: createData.ie,
          group: createData.group,
          type: createData.type,
          companyName: createData.companyName,
          fantasyName: createData.fantasyName,
          representative: createData.representative,
          active: true,
        }),
      }));
      expect(result).toHaveProperty('id');
      expect(result.id).toBeDefined();
    });

    it('should create Supplier entity with correct properties', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '00365466000190',
        ie: '987654321',
        group: 'Materials',
        type: 'National',
        companyName: 'Materials Supplier Ltd',
        fantasyName: 'Materials Supplier',
        representative: 'Jane Smith',
      };

      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(createData);

      // Assert
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Supplier));
      const savedSupplier = saveSpy.mock.calls[0][0] as Supplier;
      expect(savedSupplier.props.cnpj).toBe('00365466000190');
      expect(savedSupplier.props.ie).toBe('987654321');
      expect(savedSupplier.props.group).toBe('Materials');
      expect(savedSupplier.props.type).toBe('National');
      expect(savedSupplier.props.active).toBe(true);
    });

    it('should throw SupplierDuplicateCnpjError when CNPJ already exists', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '55.967.002/0001-46',
        ie: '111222333',
        group: 'Duplicate Group',
        type: 'Duplicate Type',
        companyName: 'Duplicate Supplier',
        fantasyName: 'Duplicate',
        representative: 'Duplicate Rep',
      };

      const existingSupplier: SupplierDto = {
        id: 'existing-id',
        cnpj: '55967002000146',
        ie: '999888777',
        group: 'Existing Group',
        type: 'Existing Type',
        companyName: 'Existing Supplier',
        fantasyName: 'Existing',
        representative: 'Existing Rep',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(existingSupplier);
      const saveSpy = jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act & Assert
      await expect(sut.execute(createData)).rejects.toThrow(SupplierDuplicateCnpjError);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should sanitize CNPJ before checking for duplicates', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '55.967.002/0001-46', // With formatting
        ie: '444555666',
        group: 'Sanitize Group',
        type: 'Sanitize Type',
        companyName: 'Sanitize Supplier',
        fantasyName: 'Sanitize',
        representative: 'Sanitize Rep',
      };

      const findByCnpjSpy = jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(createData);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledWith('55967002000146'); // Without formatting
    });

    it('should return object with id property', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '00365466000190',
        ie: '777888999',
        group: 'Return Group',
        type: 'Return Type',
        companyName: 'Return Supplier',
        fantasyName: 'Return',
        representative: 'Return Rep',
      };

      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(createData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('integration tests', () => {
    it('should create a new supplier successfully', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '55.967.002/0001-46',
        ie: '123456789012',
        group: 'Integration Group',
        type: 'Integration Type',
        companyName: 'Integration Supplier Ltd',
        fantasyName: 'Integration Supplier',
        representative: 'Integration Rep',
      };

      // Act
      const result = await sut.execute(createData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      const createdSupplier = await findSupplierById.execute(result.id);
      expect(createdSupplier).not.toBeNull();
      expect(createdSupplier).toEqual<SupplierDto>({
        id: result.id,
        cnpj: '55967002000146',
        ie: '123456789012',
        group: 'Integration Group',
        type: 'Integration Type',
        companyName: 'Integration Supplier Ltd',
        fantasyName: 'Integration Supplier',
        representative: 'Integration Rep',
        active: true,
        createdAt: createdSupplier!.createdAt,
        updatedAt: createdSupplier!.updatedAt,
      });
    });

    it('should sanitize CNPJ when creating supplier', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '00.365.466/0001-90',
        ie: '111222333444',
        group: 'Sanitize Group',
        type: 'Sanitize Type',
        companyName: 'Sanitize Test Supplier',
        fantasyName: 'Sanitize Test',
        representative: 'Sanitize Rep',
      };

      // Act
      const result = await sut.execute(createData);

      // Assert
      const createdSupplier = await findSupplierById.execute(result.id);
      expect(createdSupplier).not.toBeNull();
      expect(createdSupplier!.cnpj).toBe('00365466000190'); // Without formatting
    });

    it('should set active to true by default', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '67942043000167',
        ie: '222333444555',
        group: 'Active Group',
        type: 'Active Type',
        companyName: 'Active Supplier',
        fantasyName: 'Active',
        representative: 'Active Rep',
      };

      // Act
      const result = await sut.execute(createData);

      // Assert
      const createdSupplier = await findSupplierById.execute(result.id);
      expect(createdSupplier).not.toBeNull();
      expect(createdSupplier!.active).toBe(true);
    });

    it('should set createdAt and updatedAt timestamps', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '01427316000127',
        ie: '333444555666',
        group: 'Timestamp Group',
        type: 'Timestamp Type',
        companyName: 'Timestamp Supplier',
        fantasyName: 'Timestamp',
        representative: 'Timestamp Rep',
      };

      const beforeCreate = new Date();

      // Act
      const result = await sut.execute(createData);

      // Assert
      const afterCreate = new Date();
      const createdSupplier = await findSupplierById.execute(result.id);

      expect(createdSupplier).not.toBeNull();
      expect(createdSupplier!.createdAt).toBeDefined();
      expect(createdSupplier!.updatedAt).toBeDefined();
      expect(createdSupplier!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdSupplier!.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(createdSupplier!.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdSupplier!.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should throw SupplierDuplicateCnpjError when CNPJ already exists', async() => {
      // Arrange
      const firstSupplier: CreateSupplierInputDto = {
        cnpj: '52435131000103',
        ie: '444555666777',
        group: 'First Group',
        type: 'First Type',
        companyName: 'First Supplier',
        fantasyName: 'First',
        representative: 'First Rep',
      };

      const duplicateSupplier: CreateSupplierInputDto = {
        cnpj: '52435131000103', // Same CNPJ
        ie: '888999000111',
        group: 'Second Group',
        type: 'Second Type',
        companyName: 'Second Supplier',
        fantasyName: 'Second',
        representative: 'Second Rep',
      };

      // Act
      await sut.execute(firstSupplier);

      // Assert
      await expect(sut.execute(duplicateSupplier)).rejects.toThrow(SupplierDuplicateCnpjError);
    });

    it('should throw SupplierDuplicateCnpjError for CNPJ with different formatting', async() => {
      // Arrange
      const firstSupplier: CreateSupplierInputDto = {
        cnpj: '20021261000103',
        ie: '555666777888',
        group: 'Format Group 1',
        type: 'Format Type 1',
        companyName: 'Format Supplier 1',
        fantasyName: 'Format 1',
        representative: 'Format Rep 1',
      };

      const duplicateSupplier: CreateSupplierInputDto = {
        cnpj: '20.021.261/0001-03', // Same CNPJ with formatting
        ie: '999000111222',
        group: 'Format Group 2',
        type: 'Format Type 2',
        companyName: 'Format Supplier 2',
        fantasyName: 'Format 2',
        representative: 'Format Rep 2',
      };

      // Act
      await sut.execute(firstSupplier);

      // Assert
      await expect(sut.execute(duplicateSupplier)).rejects.toThrow(SupplierDuplicateCnpjError);
    });

    it('should create multiple suppliers with different CNPJs', async() => {
      // Arrange
      const supplier1: CreateSupplierInputDto = {
        cnpj: '75279173000190',
        ie: '111111111',
        group: 'Multi Group 1',
        type: 'Multi Type 1',
        companyName: 'Multi Supplier 1',
        fantasyName: 'Multi 1',
        representative: 'Multi Rep 1',
      };

      const supplier2: CreateSupplierInputDto = {
        cnpj: '45077596000166',
        ie: '222222222',
        group: 'Multi Group 2',
        type: 'Multi Type 2',
        companyName: 'Multi Supplier 2',
        fantasyName: 'Multi 2',
        representative: 'Multi Rep 2',
      };

      const supplier3: CreateSupplierInputDto = {
        cnpj: '12911198000144',
        ie: '333333333',
        group: 'Multi Group 3',
        type: 'Multi Type 3',
        companyName: 'Multi Supplier 3',
        fantasyName: 'Multi 3',
        representative: 'Multi Rep 3',
      };

      // Act
      const result1 = await sut.execute(supplier1);
      const result2 = await sut.execute(supplier2);
      const result3 = await sut.execute(supplier3);

      // Assert
      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).not.toBe(result3.id);
      expect(result2.id).not.toBe(result3.id);

      const created1 = await findSupplierById.execute(result1.id);
      const created2 = await findSupplierById.execute(result2.id);
      const created3 = await findSupplierById.execute(result3.id);

      expect(created1).not.toBeNull();
      expect(created2).not.toBeNull();
      expect(created3).not.toBeNull();
      expect(created1!.cnpj).toBe('75279173000190');
      expect(created2!.cnpj).toBe('45077596000166');
      expect(created3!.cnpj).toBe('12911198000144');
    });

    it('should generate unique UUID for each supplier', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '15270176000130',
        ie: '444444444',
        group: 'UUID Group',
        type: 'UUID Type',
        companyName: 'UUID Supplier',
        fantasyName: 'UUID',
        representative: 'UUID Rep',
      };

      // Act
      const result = await sut.execute(createData);

      // Assert
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should return CreateSupplierOutputDto with correct structure', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '45275773000119',
        ie: '555555555',
        group: 'Output Group',
        type: 'Output Type',
        companyName: 'Output Supplier',
        fantasyName: 'Output',
        representative: 'Output Rep',
      };

      // Act
      const result = await sut.execute(createData);

      // Assert
      expect(result).toEqual<CreateSupplierOutputDto>({
        id: expect.any(String),
      });
      expect(Object.keys(result)).toEqual(['id']);
    });

    it('should validate CNPJ and throw error for invalid CNPJ', async() => {
      // Arrange
      const createData: CreateSupplierInputDto = {
        cnpj: '00.000.000/0000-00', // Invalid CNPJ
        ie: '777777777',
        group: 'Invalid Group',
        type: 'Invalid Type',
        companyName: 'Invalid Supplier',
        fantasyName: 'Invalid',
        representative: 'Invalid Rep',
      };

      // Act & Assert
      await expect(sut.execute(createData)).rejects.toThrow();
    });
  });
});
