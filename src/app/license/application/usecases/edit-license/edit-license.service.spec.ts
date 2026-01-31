import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { LicenseNotFoundError } from 'src/app/license/domain/errors/license-not-found.error';
import { LicenseModule } from 'src/app/license/license.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LicenseDto } from '../../dtos/license.dto';
import { CreateLicense } from '../create-license/create-license.service';
import { FindLicenseById } from '../find-license-by-id/find-license-by-id.service';
import { EditLicenseInputDto } from './dtos/edit-license.dto';
import { EditLicense } from './edit-license.service';

describe('EditLicense', () => {
  let sut: EditLicense;
  let prisma: PrismaService;
  let createLicense: CreateLicense;
  let findLicenseById: FindLicenseById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LicenseModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditLicense);
    prisma = module.get(PrismaService);
    createLicense = module.get(CreateLicense);
    findLicenseById = module.get(FindLicenseById);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call licenseDao.findById and licenseDao.edit with correct values', async() => {
      // Arrange
      const id = 'license-id-1';
      const license = createMock<LicenseDto>({ id });
      const input = createMock<EditLicenseInputDto>();
      const findByIdSpy = jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(license);
      const editSpy = jest.spyOn(sut['licenseDao'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id, input);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(editSpy).toHaveBeenCalledWith(id, input);
    });

    it('should throw LicenseNotFoundError if licenseDao.findById returns null', async() => {
      // Arrange
      jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(null);
      const id = 'non-existing-id';
      const input = createMock<EditLicenseInputDto>();

      // Act & Assert
      await expect(sut.execute(id, input)).rejects.toThrow(LicenseNotFoundError);
    });

    it('should return a success message on successful edit', async() => {
      // Arrange
      const license = createMock<LicenseDto>();
      jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(license);
      jest.spyOn(sut['licenseDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(license.id, {});

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Licença atualizada com sucesso!' });
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-123',
          active: true,
        },
      });
    });

    it('should throw LicenseNotFoundError if license does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const data = createMock<EditLicenseInputDto>();

      // Act & Assert
      await expect(sut.execute(id, data)).rejects.toThrow(LicenseNotFoundError);
    });

    it('should edit a license with partial data', async() => {
      // Arrange
      const createData = {
        paymentDay: 10,
        bonusInCents: 1000,
        billingStartDate: new Date('2024-01-01'),
        license: 'Initial License',
        ownerId: owner01.id,
      };
      const createdLicense = await createLicense.execute(createData);

      // Act
      const editData: EditLicenseInputDto = {
        paymentDay: 25,
        license: 'Updated License Info',
      };
      await sut.execute(createdLicense.id, editData);

      // Assert
      const editedLicense = await findLicenseById.execute(createdLicense.id);
      expect(editedLicense).toBeDefined();
      expect(editedLicense.paymentDay).toBe(editData.paymentDay);
      expect(editedLicense.bonusInCents).toBe(createData.bonusInCents); // Unchanged
      expect(editedLicense.billingStartDate).toEqual(createData.billingStartDate); // Unchanged
      expect(editedLicense.license).toBe(editData.license);
      expect(editedLicense.ownerId).toBe(owner01.id);
    });

    it('should edit a license providing null values where allowed by PartialType (though DTO validation prevents null for required base fields)', async() => {
      // Arrange
      const createData = {
        paymentDay: 10,
        bonusInCents: 1000,
        billingStartDate: new Date('2024-01-01'),
        license: 'Initial License',
        ownerId: owner01.id,
      };
      const createdLicense = await createLicense.execute(createData);

      // Act
      const editData: EditLicenseInputDto = {
        bonusInCents: 0, // Valid change
      };
      await sut.execute(createdLicense.id, editData);

      // Assert
      const editedLicense = await findLicenseById.execute(createdLicense.id);
      expect(editedLicense).toBeDefined();
      expect(editedLicense.bonusInCents).toBe(0);
      expect(editedLicense.paymentDay).toBe(createData.paymentDay); // Unchanged
      expect(editedLicense.billingStartDate).toEqual(createData.billingStartDate); // Unchanged
      expect(editedLicense.license).toBe(createData.license); // Unchanged
      expect(editedLicense.ownerId).toBe(owner01.id); // Unchanged
    });
  });
});
