import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LicenseNotFoundError } from 'src/app/license/domain/errors/license-not-found.error';
import { LicenseModule } from 'src/app/license/license.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LicenseDto } from '../../dtos/license.dto';
import { CreateLicense } from '../create-license/create-license.service';
import { FindLicenseById } from './find-license-by-id.service';

describe('FindLicenseById', () => {
  let sut: FindLicenseById;
  let prisma: PrismaService;
  let createLicense: CreateLicense; // To create test data

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LicenseModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindLicenseById);
    prisma = module.get(PrismaService);
    createLicense = module.get(CreateLicense);

    await prisma.license.deleteMany();
  });

  afterAll(async() => {
    await prisma.license.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call licenseDao.findById with correct parameters', async() => {
      // Arrange
      const license = createMock<LicenseDto>();
      const findByIdSpy = jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(license);
      const id = 'existing-license-id';

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
    });

    it('should throw LicenseNotFoundError if licenseDao returns null', async() => {
      // Arrange
      jest.spyOn(sut['licenseDao'], 'findById').mockResolvedValue(null);
      const id = 'non-existing-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(LicenseNotFoundError);
    });
  });

  describe('integration tests', () => {
    it('should throw LicenseNotFoundError if license is not found', async() => {
      // Act & Assert
      await expect(sut.execute('non-existing-id')).rejects.toThrow(LicenseNotFoundError);
    });

    it('should return a license if found', async() => {
      // Arrange
      const createData = {
        paymentDay: 20,
        bonusInCents: 1500,
        billingStartDate: new Date('2024-05-10'),
        license: '{"config": "value"}',
        ownerId: 'owner-id',
      };
      const createdLicense = await createLicense.execute(createData);

      // Act
      const foundLicense = await sut.execute(createdLicense.id);

      // Assert
      expect(foundLicense).toBeDefined();
      expect(foundLicense).toEqual<LicenseDto>({
        id: createdLicense.id,
        paymentDay: createData.paymentDay,
        bonusInCents: createData.bonusInCents,
        billingStartDate: createData.billingStartDate,
        license: createData.license,
        ownerId: createData.ownerId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
