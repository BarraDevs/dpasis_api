import { Test } from '@nestjs/testing';
import { NfmPersistenceModule } from 'src/app/tax-invoice/nfm/application/persistence/nfm-persistence.module';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfmCronRunDaoAdapterPrisma } from './nfm-cron-run-prisma.dao';

describe('NfmCronRunDaoAdapterPrisma', () => {
  let sut: NfmCronRunDaoAdapterPrisma;
  let prisma: PrismaService;

  function makeSaveElegibleNfmsOutput(overrides: Partial<SaveElegibleNfmsOutputDto> = {}): SaveElegibleNfmsOutputDto {
    return {
      created: 1,
      skipped: 2,
      failed: 1,
      errors: [
        {
          clientId: 10,
          cnaeNbsIndopId: 20,
          message: 'Erro de teste',
        },
      ],
      ...overrides,
    };
  }

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        NfmPersistenceModule,
        ConfigModule,
      ],
      providers: [
        NfmCronRunDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(NfmCronRunDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.nfmCronRun.deleteMany();
  });

  afterAll(async() => {
    await prisma.nfmCronRun.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should persist counts and errors', async() => {
    // Arrange
    const data = makeSaveElegibleNfmsOutput();

    // Act
    const id = await sut.save(data);

    // Assert
    const row = await prisma.nfmCronRun.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row!.createdCount).toBe(1);
    expect(row!.skippedCount).toBe(2);
    expect(row!.failedCount).toBe(1);
    expect(row!.errors).toEqual([
      {
        clientId: 10,
        cnaeNbsIndopId: 20,
        message: 'Erro de teste',
      },
    ]);
    expect(row!.createdAt).toBeInstanceOf(Date);
  });

  it('should persist empty result', async() => {
    // Arrange
    const data = makeSaveElegibleNfmsOutput({
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    });

    // Act
    const id = await sut.save(data);

    // Assert
    const row = await prisma.nfmCronRun.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row!.createdCount).toBe(0);
    expect(row!.skippedCount).toBe(0);
    expect(row!.failedCount).toBe(0);
    expect(row!.errors).toEqual([]);
  });
});
