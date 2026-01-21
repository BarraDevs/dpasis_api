import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LicenseNotFoundError } from 'src/app/license/domain/errors/license-not-found.error';
import { LicenseModule } from 'src/app/license/license.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LicenseDto } from '../../dtos/license.dto';
import { CreateLicense } from '../create-license/create-license.service';
import { FindLicenseById } from '../find-license-by-id/find-license-by-id.service';
import { DeleteLicense } from './delete-license.service';

describe('DeleteLicense', () => {
  let sut: DeleteLicense;
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

    sut = module.get(DeleteLicense);
    prisma = module.get(PrismaService);
    createLicense = module.get(CreateLicense);
    findLicenseById = module.get(FindLicenseById);

    await prisma.owner.deleteMany();
    await prisma.license.deleteMany();
  });

  afterEach(async() => {
    await prisma.owner.deleteMany();
    await prisma.license.deleteMany();
    await prisma.$disconnect();;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call licenseDao.findById and licenseDao.delete with correct values', async() => {
      // Arrange
      const id = 'license-id-to-delete';
      const license = createMock<LicenseDto>({ id });
      const findByIdSpy = jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(license);
      const deleteSpy = jest.spyOn(sut['licenseDao'], 'delete').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(deleteSpy).toHaveBeenCalledWith(id);
    });

    it('should throw LicenseNotFoundError if licenseDao.findById returns null', async() => {
      // Arrange
      jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(null);
      const deleteSpy = jest.spyOn(sut['licenseDao'], 'delete');
      const id = 'non-existing-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(LicenseNotFoundError);
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should return a success message on successful deletion', async() => {
      // Arrange
      const license = createMock<LicenseDto>();
      jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(license);
      jest.spyOn(sut['licenseDao'], 'delete').mockResolvedValue();

      // Act
      const result = await sut.execute(license.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Licença deletada com sucesso!' });
    });
  });

  describe('integration tests', () => {
    it('should throw LicenseNotFoundError if the license does not exist', async() => {
      // Act & Assert
      await expect(sut.execute('non-existing-id')).rejects.toThrow(LicenseNotFoundError);
    });

    it('should delete a license successfully', async() => {
      // Arrange
      const owner = await prisma.owner.create({
        data: {
          id: 'owner-123',
          active: true,
        },
      });

      const createData = {
        paymentDay: 1,
        bonusInCents: 0,
        billingStartDate: new Date('2023-01-01'),
        license: 'Test License',
        ownerId: owner.id,
      };
      const createdLicense = await createLicense.execute(createData);

      // Act
      const result = await sut.execute(createdLicense.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Licença deletada com sucesso!' });
      // Verify deletion by trying to find it again
      await expect(findLicenseById.execute(createdLicense.id)).rejects.toThrow(LicenseNotFoundError);
    });
  });
});
