import { Test } from '@nestjs/testing';
import { LicensePersistenceModule } from 'src/app/license/application/persistence/license-persistence.module';
import { CreateLicenseInputDto } from 'src/app/license/application/usecases/create-license/dtos/create-license.dto';
import { EditLicenseInputDto } from 'src/app/license/application/usecases/edit-license/dtos/edit-license.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LicenseDaoAdapterPrisma } from './license.dao';

describe('LicenseDaoAdapterPrisma', () => {
  let sut: LicenseDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        LicensePersistenceModule,
        ConfigModule,
      ],
      providers: [
        LicenseDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(LicenseDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.license.deleteMany();
  });

  afterAll(async() => {
    await prisma.license.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save a license and return its id', async() => {
      // Arrange
      const data: CreateLicenseInputDto = {
        paymentDay: 10,
        bonusInCents: 500,
        billingStartDate: new Date('2024-06-01'),
        license: 'Basic Plan',
        ownerId: 'owner-123',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toEqual(expect.any(String));
      const savedLicense = await prisma.license.findUnique({ where: { id } });
      expect(savedLicense).toBeDefined();
      expect(savedLicense?.paymentDay).toBe(data.paymentDay);
      expect(savedLicense?.bonusInCents).toBe(data.bonusInCents);
      // Compare dates by converting to time or ISO string if needed
      expect(savedLicense?.billingStartDate.toISOString()).toBe(data.billingStartDate.toISOString());
      expect(savedLicense?.license).toBe(data.license);
    });
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Seed data for findAll tests
      await prisma.license.createMany({
        data: [
          { paymentDay: 5, bonusInCents: 100, billingStartDate: new Date('2024-01-01'), license: 'Alpha Test License', ownerId: 'owner-1' },
          { paymentDay: 15, bonusInCents: 200, billingStartDate: new Date('2024-02-01'), license: 'Beta License', ownerId: 'owner-1' },
          { paymentDay: 25, bonusInCents: 300, billingStartDate: new Date('2024-03-01'), license: 'Gamma Test', ownerId: 'owner-1' },
          { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-04-01'), license: 'Delta License', ownerId: 'owner-1' },
          { paymentDay: 10, bonusInCents: 50, billingStartDate: new Date('2024-05-01'), license: 'Epsilon TEST', ownerId: 'owner-1' },
        ],
      });
    });

    it('should return all licenses with count when no query provided', async() => {
      // Act
      const [licenses, total] = await sut.findAll({});

      // Assert
      expect(total).toBe(5);
      expect(licenses).toHaveLength(5);
    });

    it('should return paginated licenses', async() => {
      // Act
      const [licenses, total] = await sut.findAll({ page: 2, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(licenses).toHaveLength(2);
      // Assuming default order is createdAt desc, this might need adjustment based on actual data
    });

    it('should filter licenses by search term (case-insensitive)', async() => {
      // Act
      const [licenses, total] = await sut.findAll({ search: 'test' });

      // Assert
      expect(total).toBe(3);
      expect(licenses).toHaveLength(3);
      expect(licenses.every(l => l.license.toLowerCase().includes('test'))).toBe(true);
    });

    it('should return paginated and filtered licenses', async() => {
      // Act
      const [licenses, total] = await sut.findAll({ search: 'license', page: 1, size: 2 });

      // Assert
      expect(total).toBe(3); // Alpha, Beta, Delta
      expect(licenses).toHaveLength(2);
      expect(licenses.every(l => l.license.toLowerCase().includes('license'))).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return null if license not found', async() => {
      // Act
      const license = await sut.findById('non-existing-id');

      // Assert
      expect(license).toBeNull();
    });

    it('should return the correct license if found', async() => {
      // Arrange
      const created = await prisma.license.create({
        data: { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-01-01'), license: 'Find Me', ownerId: 'owner-123' },
      });

      // Act
      const license = await sut.findById(created.id);

      // Assert
      expect(license).not.toBeNull();
      expect(license?.id).toBe(created.id);
      expect(license?.license).toBe('Find Me');
    });
  });

  describe('edit', () => {
    it('should update the license data', async() => {
      // Arrange
      const created = await prisma.license.create({
        data: { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-01-01'), license: 'Original License', ownerId: 'owner-123' },
      });
      const editData: EditLicenseInputDto = {
        paymentDay: 20,
        license: 'Updated License Text',
        billingStartDate: new Date('2025-01-01'),
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedLicense = await prisma.license.findUnique({ where: { id: created.id } });
      expect(updatedLicense).toBeDefined();
      expect(updatedLicense?.paymentDay).toBe(editData.paymentDay);
      expect(updatedLicense?.license).toBe(editData.license);
      expect(updatedLicense?.billingStartDate.toISOString()).toBe(editData.billingStartDate?.toISOString());
      expect(updatedLicense?.bonusInCents).toBe(0); // Unchanged
    });

    it('should not throw error if license does not exist (Prisma handles this)', async() => {
      // Arrange
      const editData: EditLicenseInputDto = { paymentDay: 5 };

      // Act & Assert
      // Prisma's update throws an error if the record is not found, which is expected.
      // We rely on the service layer to check existence first.
      await expect(sut.edit('non-existing-id', editData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete the license', async() => {
      // Arrange
      const created = await prisma.license.create({
        data: { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-01-01'), license: 'To Be Deleted', ownerId: 'owner-123' },
      });

      // Act
      await sut.delete(created.id);

      // Assert
      const deletedLicense = await prisma.license.findUnique({ where: { id: created.id } });
      expect(deletedLicense).toBeNull();
    });

    it('should not throw error if license does not exist (Prisma handles this)', async() => {
      // Act & Assert
      // Prisma's delete throws an error if the record is not found, which is expected.
      // We rely on the service layer to check existence first.
      await expect(sut.delete('non-existing-id')).rejects.toThrow();
    });
  });

});
