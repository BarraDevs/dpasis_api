import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { VoucherDaoAdapterPrisma } from './voucher-prisma.dao';
import { ResaleIdentifierDto } from 'src/app/voucher/application/persistence/dao/voucher-dao.interface';

describe('VoucherDaoAdapterPrisma - Integration tests', () => {
  let sut: VoucherDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [VoucherDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(VoucherDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findIndicatorResales', () => {
    it('should return empty array when no indicator resales exist', async() => {
      // Arrange — no resales

      // Act
      const result = await sut.findIndicatorResales();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return only active `indicator` resales', async() => {
      // Arrange
      const r1 = await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), identifier: 'A001', manufacturerResale: true, active: true },
      });
      await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), identifier: 'A002', manufacturerResale: false, active: true },
      });
      await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), identifier: 'A003', manufacturerResale: true, active: false },
      });

      // Act
      const result = await sut.findIndicatorResales();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(r1.id);
      expect(result[0].identifier).toBe('A001');
    });

    it('should return id and identifier fields', async() => {
      // Arrange
      const r = await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), identifier: 'X999', manufacturerResale: true, active: true },
      });

      // Act
      const result = await sut.findIndicatorResales();

      // Assert
      expect(result[0]).toEqual<ResaleIdentifierDto>({ id: r.id, identifier: 'X999' });
    });

    it('should return null identifier when resale has no identifier', async() => {
      // Arrange
      await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), identifier: null, manufacturerResale: true, active: true },
      });

      // Act
      const result = await sut.findIndicatorResales();

      // Assert
      expect(result[0].identifier).toBeNull();
    });
  });

  describe('updateVouchers', () => {
    it('should update voucher field for all given resales atomically', async() => {
      // Arrange
      const r1 = await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), manufacturerResale: true, active: true },
      });
      const r2 = await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), manufacturerResale: true, active: true },
      });

      // Act
      await sut.updateVouchers([
        { id: r1.id, voucher: 'CAPUYMOMTZTQ' },
        { id: r2.id, voucher: 'CAPUYMUTZQ2G' },
      ]);

      // Assert
      const updated1 = await prisma.resale.findUnique({ where: { id: r1.id } });
      const updated2 = await prisma.resale.findUnique({ where: { id: r2.id } });
      expect(updated1?.voucher).toBe('CAPUYMOMTZTQ');
      expect(updated2?.voucher).toBe('CAPUYMUTZQ2G');
    });

    it('should do nothing when updates array is empty', async() => {
      // Act + Assert — should not throw
      await expect(sut.updateVouchers([])).resolves.toBeUndefined();
    });

    it('should overwrite existing voucher on re-run', async() => {
      // Arrange
      const r = await prisma.resale.create({
        data: { ...buildMinimalResaleData(nextResaleFixtureId()), voucher: 'OLD_VOUCHER', indicatorResale: true, active: true },
      });

      // Act
      await sut.updateVouchers([{ id: r.id, voucher: 'NEW_VOUCHER' }]);

      // Assert
      const updated = await prisma.resale.findUnique({ where: { id: r.id } });
      expect(updated?.voucher).toBe('NEW_VOUCHER');
    });
  });
});
