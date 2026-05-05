import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { VoucherModule } from 'src/app/voucher/voucher.module';
import { GenerateManufacturerVouchers } from './generate-manufacturer-vouchers.service';

describe('GenerateManufacturerVouchers - Integration tests', () => {
  let sut: GenerateManufacturerVouchers;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [VoucherModule],
    }).compile();

    sut = module.get(GenerateManufacturerVouchers);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return generated=0 when no indicator resales exist', async() => {
    // Arrange — no resales in DB

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it('should skip inactive resales', async() => {
    // Arrange
    await prisma.resale.create({
      data: {
        ...buildMinimalResaleData(nextResaleFixtureId()),
        identifier: '000HU',
        manufacturerResale: true,
        active: false,
      },
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(0);
  });

  it('should skip resales that are not indicator resales', async() => {
    // Arrange
    await prisma.resale.create({
      data: {
        ...buildMinimalResaleData(nextResaleFixtureId()),
        identifier: '000HU',
        manufacturerResale: false,
        active: true,
      },
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(0);
  });

  it('should skip resales with null identifier', async() => {
    // Arrange
    await prisma.resale.create({
      data: {
        ...buildMinimalResaleData(nextResaleFixtureId()),
        identifier: null,
        manufacturerResale: true,
        active: true,
      },
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('should generate and persist voucher for active indicator resale with identifier', async() => {
    // Arrange
    const resale = await prisma.resale.create({
      data: {
        ...buildMinimalResaleData(nextResaleFixtureId()),
        identifier: '000HU',
        manufacturerResale: true,
        active: true,
      },
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(1);
    expect(result.skipped).toBe(0);

    const updated = await prisma.resale.findUnique({ where: { id: resale.id } });
    expect(updated?.voucher).toBeTruthy();
    expect(typeof updated?.voucher).toBe('string');
  });

  it('should generate vouchers for multiple active indicator resales', async() => {
    // Arrange
    const id1 = nextResaleFixtureId();
    const id2 = nextResaleFixtureId();
    await prisma.resale.create({
      data: { ...buildMinimalResaleData(id1), identifier: '000HU', manufacturerResale: true, active: true },
    });
    await prisma.resale.create({
      data: { ...buildMinimalResaleData(id2), identifier: '000HV', manufacturerResale: true, active: true },
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(2);
    expect(result.skipped).toBe(0);

    const updated1 = await prisma.resale.findUnique({ where: { id: id1 } });
    const updated2 = await prisma.resale.findUnique({ where: { id: id2 } });
    expect(updated1?.voucher).toBeTruthy();
    expect(updated2?.voucher).toBeTruthy();
    expect(updated1?.voucher).not.toBe(updated2?.voucher);
  });

  it('should be idempotent — running twice produces the same voucher', async() => {
    // Arrange
    const resale = await prisma.resale.create({
      data: {
        ...buildMinimalResaleData(nextResaleFixtureId()),
        identifier: '000HU',
        manufacturerResale: true,
        active: true,
      },
    });

    // Act
    await sut.execute();
    const after1 = await prisma.resale.findUnique({ where: { id: resale.id } });
    await sut.execute();
    const after2 = await prisma.resale.findUnique({ where: { id: resale.id } });

    // Assert
    expect(after1?.voucher).toBe(after2?.voucher);
  });

  it('should return year in output', async() => {
    // Act
    const result = await sut.execute();

    // Assert
    expect(result.year).toBe(new Date().getFullYear());
  });
});
