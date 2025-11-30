import { Test, TestingModule } from '@nestjs/testing';
import { SupplierDto } from 'src/app/supplier/application/dtos/supplier.dto';
import { SupplierPersistenceModule } from 'src/app/supplier/application/persistence/supplier-persistence.module';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierRepositoryAdapterPrisma } from './supplier.repository';

describe('SupplierRepositoryAdapterPrisma (Integration)', () => {
  let sut: SupplierRepositoryAdapterPrisma;
  let prisma: PrismaService;

  const supplierProps = {
    cnpj: '02.832.358/0001-06',
    ie: '987.654.321.110',
    group: 'Teste',
    type: 'Teste',
    companyName: 'Repo Test Inc.',
    fantasyName: 'Repo Test',
    representative: 'Mr. Test',
  };

  beforeAll(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        SupplierPersistenceModule,
      ],
      providers: [
        SupplierRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(SupplierRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.owner.deleteMany();
  });

  afterEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.$disconnect();
  });

  describe('findById', () => {
    it('should return a Supplier when found', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      // Act
      const foundSupplier = await sut.findById(supplier.props.id);

      // Assert
      expect(foundSupplier).toBeDefined();
      expect(foundSupplier?.props).toEqual(supplier.props);
    });

    it('should return null when Supplier not found', async() => {
      // Act
      const foundSupplier = await sut.findById('non-existent-id');

      // Assert
      expect(foundSupplier).toBeNull();
    });
  });

  describe('save', () => {
    it('should create an Owner and a Supplier with the same ID', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      const sharedId = supplier.props.id;

      // Act
      await sut.save(supplier);

      // Assert
      // 1. Verificar o Owner
      const owner = await prisma.owner.findUnique({
        where: { id: sharedId },
      });
      expect(owner).toBeDefined();
      expect(owner?.id).toBe(sharedId);

      // 2. Verificar o Supplier
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: sharedId },
      });
      expect(savedSupplier).toBeDefined();
      expect(savedSupplier?.id).toBe(sharedId);
      expect(savedSupplier?.representative).toBe(supplierProps.representative);

      // 3. Verificar a relação no Owner
      const ownerWithSupplier = await prisma.owner.findUnique({
        where: { id: sharedId },
        include: { supplier: true },
      });
      expect(ownerWithSupplier?.supplier).toBeDefined();
      expect(ownerWithSupplier?.supplier?.id).toBe(sharedId);
    });

    it('should throw an error when trying to save a Supplier with an existing ID', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      // Act & Assert
      await expect(sut.save(supplier)).rejects.toThrow();
    });

    it('should throw an error when trying to save a Supplier with an existing CNPJ', async() => {
      // Arrange
      const supplier1 = Supplier.create(supplierProps);
      const supplier2 = Supplier.create({ ...supplierProps, ie: '111.222.333.444' });
      await sut.save(supplier1);

      // Act & Assert
      await expect(sut.save(supplier2)).rejects.toThrow();
    });
  });

  describe('edit', () => {
    it('should update the supplier data', async() => {
      // Arrange
      const supplier = Supplier.create(supplierProps);
      await sut.save(supplier);

      const editedSupplier = Supplier.load({
        ...supplier.props,
        companyName: 'Updated Company Name Ltd.',
        representative: 'Ms. Updated',
      });

      // Act
      await sut.edit(editedSupplier);

      // Assert
      const updatedSupplier = await prisma.supplier.findUnique({ where: { id: supplier.props.id } });
      expect(updatedSupplier).toBeDefined();
      expect(updatedSupplier).toEqual<SupplierDto>({
        id: supplier.props.id,
        cnpj: '02832358000106',
        ie: supplierProps.ie,
        group: supplierProps.group,
        type: supplierProps.type,
        fantasyName: supplierProps.fantasyName,
        companyName: 'Updated Company Name Ltd.',
        representative: 'Ms. Updated',
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error when trying to edit non-existent supplier', async() => {
      // Arrange
      const nonExistentSupplier = Supplier.load({
        id: 'non-existent-id',
        cnpj: '43.850.499/0001-39',
        ie: '111.222.333.444',
        group: 'NonExistentGroup',
        type: 'NonExistentType',
        companyName: 'Non Existent Company Ltd',
        fantasyName: 'Non Existent Company',
        representative: 'Ghost User',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(nonExistentSupplier)).rejects.toThrow();
    });

    it('should throw error when trying to change CNPJ to an existing one', async() => {
      // Arrange
      const supplier1 = Supplier.create(supplierProps);
      const supplier2 = Supplier.create({
        ...supplierProps,
        cnpj: '43.850.499/0001-39',
      });
      await sut.save(supplier1);
      await sut.save(supplier2);

      const editedSupplier2 = Supplier.load({
        ...supplier2.props,
        cnpj: supplier1.props.cnpj,
      });

      // Act & Assert
      await expect(sut.edit(editedSupplier2)).rejects.toThrow();
    });
  });
});
