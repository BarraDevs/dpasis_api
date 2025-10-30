import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LicenseModule } from 'src/app/license/license.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { LicenseDto } from '../../dtos/license.dto';
import { CreateLicense } from '../create-license/create-license.service';
import { FindAllLicenseQueryDto } from './dtos/find-all-license.dto';
import { FindAllLicense } from './find-all-license.service';

describe('FindAllLicense', () => {
  let sut: FindAllLicense;
  let prisma: PrismaService;
  let createLicense: CreateLicense; // To create test data

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LicenseModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllLicense);
    prisma = module.get(PrismaService);
    createLicense = module.get(CreateLicense); // Get CreateLicense service

    await prisma.license.deleteMany();
  });

  afterAll(async() => {
    await prisma.license.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call licenseDao.findAll with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllLicenseQueryDto>({ page: 2, size: 5, search: 'test' });
      const findAllSpy = jest.spyOn(sut['licenseDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('integration tests', () => {
    it('should return an empty pagination object when no licenses exist', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toEqual<IPagination<LicenseDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return all licenses when no queries are provided', async() => {
      // Arrange
      const lic1 = await createLicense.execute({ paymentDay: 5, bonusInCents: 100, billingStartDate: new Date('2024-01-01'), license: 'Basic', ownerId: 'ow1' });
      const lic2 = await createLicense.execute({ paymentDay: 15, bonusInCents: 200, billingStartDate: new Date('2024-02-01'), license: 'Pro', ownerId: 'ow1' });

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: lic1.id }),
          expect.objectContaining({ id: lic2.id }),
        ])
      );
    });

    it('should return paginated licenses', async() => {
      // Arrange
      for (let i = 1; i <= 15; i++) {
        await createLicense.execute({
          paymentDay: i,
          bonusInCents: i * 100,
          billingStartDate: new Date(`2024-01-${i < 10 ? '0' : ''}${i}`),
          license: `License ${i}`,
          ownerId: `ow${i}`,
        });
      }

      // Act
      const resultPage1 = await sut.execute({ page: 1, size: 10 });
      const resultPage2 = await sut.execute({ page: 2, size: 10 });

      // Assert
      expect(resultPage1.data).toHaveLength(10);
      expect(resultPage1.totalItems).toBe(15);
      expect(resultPage1.totalPages).toBe(2);
      expect(resultPage1.currentPage).toBe(1);

      expect(resultPage2.data).toHaveLength(5);
      expect(resultPage2.totalItems).toBe(15);
      expect(resultPage2.totalPages).toBe(2);
      expect(resultPage2.currentPage).toBe(2);
    });

    it('should return licenses filtered by search term (case-insensitive)', async() => {
      // Arrange
      const lic1 = await createLicense.execute({ paymentDay: 5, bonusInCents: 100, billingStartDate: new Date('2024-01-01'), license: 'Alpha License', ownerId: 'owner-1' });
      await createLicense.execute({ paymentDay: 15, bonusInCents: 200, billingStartDate: new Date('2024-02-01'), license: 'Beta Package', ownerId: 'owner-1' });
      const lic3 = await createLicense.execute({ paymentDay: 25, bonusInCents: 300, billingStartDate: new Date('2024-03-01'), license: 'Gamma alpha license', ownerId: 'owner-1' });


      // Act
      const result = await sut.execute({ search: 'alpha' });

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: lic1.id }),
          expect.objectContaining({ id: lic3.id }),
        ])
      );
    });
  });
});
