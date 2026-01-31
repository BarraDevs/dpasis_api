import { Test, TestingModule } from '@nestjs/testing';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateSupplier } from '../create-supplier/create-supplier.service';
import { FindSupplierById } from '../find-supplier-by-id/find-supplier-by-id.service';
import { UpdateSupplierStatus } from './update-supplier-status.service';

describe('UpdateSupplierStatus', () => {
  let sut: UpdateSupplierStatus;
  let prisma: PrismaService;
  let createSupplier: CreateSupplier;
  let findSupplierById: FindSupplierById;
  let companyId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(UpdateSupplierStatus);
    prisma = module.get(PrismaService);
    createSupplier = module.get(CreateSupplier);
    findSupplierById = module.get(FindSupplierById);

    await prisma.truncate();

    // Create a test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        fantasyName: 'Test',
        document: '12345678000190',
        ie: '123456789',
        zipCode: '12345678',
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test District',
        city: 'Test City',
        state: 'TS',
        phone01: '1234567890',
        email01: 'test@company.com',
        active: true,
      },
    });
    companyId = company.id;
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('Integration tests', () => {
    it('should toggle status multiple times', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '01.427.316/0001-27',
        ie: '111.222.333',
        group: 'Multiple Toggle Group',
        type: 'Multiple Toggle Type',
        companyName: 'Multiple Toggle Supplier Ltd',
        fantasyName: 'Multiple Toggle',
        representative: 'Multiple Toggle Rep',
        companyIds: [companyId],
      });

      // Act & Assert - Toggle 1: active -> inactive
      await sut.execute(supplier.id);
      let updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier!.active).toBe(false);

      // Toggle 2: inactive -> active
      await sut.execute(supplier.id);
      updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier!.active).toBe(true);

      // Toggle 3: active -> inactive
      await sut.execute(supplier.id);
      updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier!.active).toBe(false);

      // Toggle 4: inactive -> active
      await sut.execute(supplier.id);
      updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier!.active).toBe(true);
    });

    it('should throw SupplierNotFoundError when supplier does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-supplier-id';

      // Act & Assert
      await expect(sut.execute(nonExistentId)).rejects.toThrow(SupplierNotFoundError);
    });

    it('should not modify other supplier properties when toggling status', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '52.435.131/0001-03',
        ie: '444.555.666',
        group: 'Preserve Properties Group',
        type: 'Preserve Properties Type',
        companyName: 'Preserve Properties Supplier Ltd',
        fantasyName: 'Preserve Properties',
        representative: 'Preserve Properties Rep',
        companyIds: [companyId],
      });

      const originalSupplier = await findSupplierById.execute(supplier.id);

      // Act
      await sut.execute(supplier.id);

      // Assert
      const updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier).not.toBeNull();

      // Verify other properties remain unchanged
      expect(updatedSupplier!.id).toBe(originalSupplier!.id);
      expect(updatedSupplier!.cnpj).toBe(originalSupplier!.cnpj);
      expect(updatedSupplier!.ie).toBe(originalSupplier!.ie);
      expect(updatedSupplier!.group).toBe(originalSupplier!.group);
      expect(updatedSupplier!.type).toBe(originalSupplier!.type);
      expect(updatedSupplier!.companyName).toBe(originalSupplier!.companyName);
      expect(updatedSupplier!.fantasyName).toBe(originalSupplier!.fantasyName);
      expect(updatedSupplier!.representative).toBe(originalSupplier!.representative);
      expect(updatedSupplier!.createdAt).toEqual(originalSupplier!.createdAt);

      // Only active status should change
      expect(updatedSupplier!.active).not.toBe(originalSupplier!.active);
      expect(updatedSupplier!.active).toBe(false);
    });

    it('should preserve createdAt timestamp when toggling status', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '20.021.261/0001-03',
        ie: '777.888.999',
        group: 'Timestamp Group',
        type: 'Timestamp Type',
        companyName: 'Timestamp Supplier Ltd',
        fantasyName: 'Timestamp',
        representative: 'Timestamp Rep',
        companyIds: [companyId],
      });

      const originalSupplier = await findSupplierById.execute(supplier.id);
      const originalCreatedAt = originalSupplier!.createdAt;

      // Act
      await sut.execute(supplier.id);

      // Assert
      const updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.createdAt).toEqual(originalCreatedAt);
    });

    it('should update updatedAt timestamp when toggling status', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '75.279.173/0001-90',
        ie: '000.111.222',
        group: 'Updated Timestamp Group',
        type: 'Updated Timestamp Type',
        companyName: 'Updated Timestamp Supplier Ltd',
        fantasyName: 'Updated Timestamp',
        representative: 'Updated Timestamp Rep',
        companyIds: [companyId],
      });

      const originalSupplier = await findSupplierById.execute(supplier.id);
      const originalUpdatedAt = originalSupplier!.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act
      await sut.execute(supplier.id);

      // Assert
      const updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should preserve company associations when toggling status', async() => {
      // Arrange
      const company2 = await prisma.company.create({
        data: {
          name: 'Test Company 2',
          fantasyName: 'Test 2',
          document: '98765432000190',
          ie: '987654321',
          zipCode: '87654321',
          street: 'Test Street 2',
          number: '456',
          neighborhood: 'Test District 2',
          city: 'Test City 2',
          state: 'T2',
          phone01: '0987654321',
          email01: 'test2@company.com',
          active: true,
        },
      });

      const supplier = await createSupplier.execute({
        cnpj: '45.077.596/0001-66',
        ie: '333.444.555',
        group: 'Companies Group',
        type: 'Companies Type',
        companyName: 'Companies Supplier Ltd',
        fantasyName: 'Companies',
        representative: 'Companies Rep',
        companyIds: [companyId, company2.id],
      });

      const originalSupplier = await findSupplierById.execute(supplier.id);
      expect(originalSupplier!.companies).toHaveLength(2);

      // Act
      await sut.execute(supplier.id);

      // Assert
      const updatedSupplier = await findSupplierById.execute(supplier.id);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.companies).toHaveLength(2);

      const companyIds = updatedSupplier!.companies.map(c => c.id);
      expect(companyIds).toContain(companyId);
      expect(companyIds).toContain(company2.id);
    });

    it('should return success message with correct text', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '12.911.198/0001-44',
        ie: '666.777.888',
        group: 'Message Test Group',
        type: 'Message Test Type',
        companyName: 'Message Test Supplier Ltd',
        fantasyName: 'Message Test',
        representative: 'Message Test Rep',
        companyIds: [companyId],
      });

      // Act
      const result = await sut.execute(supplier.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Status atualizado com sucesso.');
      expect(Object.keys(result)).toEqual(['message']);
    });

    it('should handle multiple suppliers and only toggle the specified one', async() => {
      // Arrange
      const supplier1 = await createSupplier.execute({
        cnpj: '15.270.176/0001-30',
        ie: '111.111.111',
        group: 'Supplier 1 Group',
        type: 'Supplier 1 Type',
        companyName: 'Supplier 1 Ltd',
        fantasyName: 'Supplier 1',
        representative: 'Rep 1',
        companyIds: [companyId],
      });

      const supplier2 = await createSupplier.execute({
        cnpj: '45.275.773/0001-19',
        ie: '222.222.222',
        group: 'Supplier 2 Group',
        type: 'Supplier 2 Type',
        companyName: 'Supplier 2 Ltd',
        fantasyName: 'Supplier 2',
        representative: 'Rep 2',
        companyIds: [companyId],
      });

      const supplier3 = await createSupplier.execute({
        cnpj: '34.028.316/0001-03',
        ie: '333.333.333',
        group: 'Supplier 3 Group',
        type: 'Supplier 3 Type',
        companyName: 'Supplier 3 Ltd',
        fantasyName: 'Supplier 3',
        representative: 'Rep 3',
        companyIds: [companyId],
      });

      // Act - Toggle only supplier2
      await sut.execute(supplier2.id);

      // Assert
      const updatedSupplier1 = await findSupplierById.execute(supplier1.id);
      const updatedSupplier2 = await findSupplierById.execute(supplier2.id);
      const updatedSupplier3 = await findSupplierById.execute(supplier3.id);

      expect(updatedSupplier1!.active).toBe(true); // Unchanged
      expect(updatedSupplier2!.active).toBe(false); // Toggled
      expect(updatedSupplier3!.active).toBe(true); // Unchanged
    });
  });
});
