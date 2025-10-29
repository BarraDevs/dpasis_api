import { Test, TestingModule } from '@nestjs/testing';
import { LicenseModule } from 'src/app/license/license.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateLicense } from './create-license.service';

describe('CreateLicense', () => {
  let sut: CreateLicense;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LicenseModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateLicense);
    prisma = module.get(PrismaService);

    await prisma.license.deleteMany();
  });

  afterAll(async() => {
    await prisma.license.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
