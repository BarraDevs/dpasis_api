import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LicenseModule } from 'src/app/license/license.module';
import { OwnerDto } from 'src/app/owner/application/dtos/owner.dto';
import { OwnerNotActiveError } from 'src/app/owner/domain/errors/owner-not-active.error';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LicenseDto } from '../../dtos/license.dto';
import { FindLicenseById } from '../find-license-by-id/find-license-by-id.service'; // Assuming FindById exists
import { CreateLicense } from './create-license.service';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from './dtos/create-license.dto';

describe('CreateLicense', () => {
  let sut: CreateLicense;
  let prisma: PrismaService;
  let findLicenseById: FindLicenseById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LicenseModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateLicense);
    prisma = module.get(PrismaService);
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
    it('should call licenseDao.save with correct values', async() => {
      // Arrange
      const id = 'license-id-123';
      const input = createMock<CreateLicenseInputDto>({ billingStartDate: new Date('2024-11-01') });
      const licenseDaoSpy = jest.spyOn(sut['licenseDao'], 'save').mockResolvedValue(id);

      const owner = createMock<OwnerDto>();
      jest.spyOn(sut['findOwnerById'], 'execute').mockResolvedValue(owner);

      // Act
      await sut.execute(input);

      // Assert
      expect(licenseDaoSpy).toHaveBeenCalledWith({
        ...input,
        ownerId: owner.id,
        billingStartDate: expect.any(Date),
      });
    });

    it('should return correct output dto', async() => {
      // Arrange
      const id = 'license-id-456';
      const input = createMock<CreateLicenseInputDto>({ billingStartDate: new Date('2024-11-01') });
      jest.spyOn(sut['licenseDao'], 'save').mockResolvedValue(id);

      const owner = createMock<OwnerDto>();
      jest.spyOn(sut['findOwnerById'], 'execute').mockResolvedValue(owner);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual<CreateLicenseOutputDto>({ id });
    });
  });

  describe('integration tests', () => {
    it('should throw an error when owner does not exist', async() => {
      // Arrange
      const input: CreateLicenseInputDto = {
        paymentDay: 15,
        bonusInCents: 1000,
        billingStartDate: new Date('2024-10-01'),
        license: 'Pro Plan',
        ownerId: 'non-existent-owner-id',
      };

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(OwnerNotFoundError);
    });

    it('should throw an error if owner is not active', async() => {
      // Arrange
      const owner = await prisma.owner.create({
        data: {
          id: 'owner-id',
          active: true,
        },
      });

      await prisma.owner.update({
        where: { id: owner.id },
        data: { active: false },
      });

      const input: CreateLicenseInputDto = {
        paymentDay: 10,
        bonusInCents: 5000,
        billingStartDate: new Date('2024-12-01'),
        license: '{"features": ["basic", "advanced"]}',
        ownerId: owner.id,
      };

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(OwnerNotActiveError);
    });

    it('should create a license with valid data', async() => {
      // Arrange
      const owner = await prisma.owner.create({
        data: {
          id: 'owner-id',
          active: true,
        },
      });

      const input: CreateLicenseInputDto = {
        paymentDay: 10,
        bonusInCents: 5000, // R$ 50.00
        billingStartDate: new Date('2024-12-01'), // Use Date object directly
        license: '{"features": ["basic", "advanced"]}',
        ownerId: owner.id,
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdLicense = await findLicenseById.execute(output.id); // Use FindById to verify
      expect(createdLicense).toBeDefined();
      expect(createdLicense).toEqual<LicenseDto>({
        id: output.id,
        paymentDay: input.paymentDay,
        bonusInCents: input.bonusInCents,
        billingStartDate: input.billingStartDate, // Compare Date objects
        license: input.license,
        ownerId: owner.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
