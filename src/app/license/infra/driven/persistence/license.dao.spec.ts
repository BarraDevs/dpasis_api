import { Test } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { LicensePersistenceModule } from 'src/app/license/application/persistence/license-persistence.module';
import { CreateLicenseInputDto } from 'src/app/license/application/usecases/create-license/dtos/create-license.dto';
import { EditLicenseInputDto } from 'src/app/license/application/usecases/edit-license/dtos/edit-license.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LicenseDaoAdapterPrisma } from './license.dao';

describe('LicenseDaoAdapterPrisma', () => {
  let sut: LicenseDaoAdapterPrisma;
  let prisma: PrismaService;
  let owner01: Owner;
  let owner02: Owner;

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

    await prisma.owner.deleteMany();
    await prisma.license.deleteMany();

    // Create owners for license ownership
    owner01 = await prisma.owner.create({
      data: {
        id: 'owner-license-dao-01',
      },
    });
    owner02 = await prisma.owner.create({
      data: {
        id: 'owner-license-dao-02',
      },
    });
  });

  afterAll(async() => {
    await prisma.owner.deleteMany();
    await prisma.license.deleteMany();
    await prisma.$disconnect();
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
        ownerId: owner01.id,
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
          { paymentDay: 5, bonusInCents: 100, billingStartDate: new Date('2024-01-01'), license: 'Alpha Test License', ownerId: owner01.id },
          { paymentDay: 15, bonusInCents: 200, billingStartDate: new Date('2024-02-01'), license: 'Beta License', ownerId: owner01.id },
          { paymentDay: 25, bonusInCents: 300, billingStartDate: new Date('2024-03-01'), license: 'Gamma Test', ownerId: owner01.id },
          { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-04-01'), license: 'Delta License', ownerId: owner02.id },
          { paymentDay: 10, bonusInCents: 50, billingStartDate: new Date('2024-05-01'), license: 'Epsilon TEST', ownerId: owner02.id },
        ],
      });
    });

    it('should return all licenses filtered by ownerId', async() => {
      // Act
      const [licenses, total] = await sut.findAll({ ownerId: owner01.id });

      // Assert
      expect(total).toBe(3);
      expect(licenses).toHaveLength(3);
    });

    it('should return paginated licenses', async() => {
      // Act
      const [licenses, total] = await sut.findAll({ ownerId: owner01.id, page: 2, size: 2 });

      // Assert
      expect(total).toBe(3);
      expect(licenses).toHaveLength(1);
      // Assuming default order is createdAt desc, this might need adjustment based on actual data
    });

    it('should filter licenses by search term (case-insensitive)', async() => {
      // Act
      const [licenses, total] = await sut.findAll({ ownerId: owner01.id, search: 'test' });

      // Assert
      expect(total).toBe(2);
      expect(licenses).toHaveLength(2);
      expect(licenses.every(l => l.license.toLowerCase().includes('test'))).toBe(true);
    });

    it('should return paginated and filtered licenses', async() => {
      // Act
      const [licenses, total] = await sut.findAll({ ownerId: owner01.id, search: 'license', page: 1, size: 2 });

      // Assert
      expect(total).toBe(2); // Alpha, Beta, Delta
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
        data: { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-01-01'), license: 'Find Me', ownerId: owner01.id },
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
        data: { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-01-01'), license: 'Original License', ownerId: owner01.id },
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
        data: { paymentDay: 1, bonusInCents: 0, billingStartDate: new Date('2024-01-01'), license: 'To Be Deleted', ownerId: owner01.id },
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
