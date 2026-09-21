import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { NfmPersistenceModule } from 'src/app/tax-invoice/nfm/application/persistence/nfm-persistence.module';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfmDaoAdapterPrisma } from './nfm-prisma.dao';

describe('NfmDaoAdapterPrisma', () => {
  let sut: NfmDaoAdapterPrisma;
  let prisma: PrismaService;
  let cnaeNbsIndopId: number;
  let cnaeNbsIndopId2: number;

  async function createNfm(overrides: {
    clientId?: number;
    nfseId?: number | null;
    cnaeNbsIndopId?: number;
    data?: Prisma.InputJsonValue;
  } = {}) {
    const now = new Date();
    return prisma.nfm.create({
      data: {
        clientId: overrides.clientId ?? 1,
        clientDocument: '00000000000101',
        companyName: 'Empresa Teste',
        referenceMonth: now.getMonth() + 1,
        referenceYear: now.getFullYear(),
        totalValueInCents: 10000,
        cnaeNbsIndopId: overrides.cnaeNbsIndopId ?? cnaeNbsIndopId,
        nfseId: overrides.nfseId ?? null,
        data: overrides.data ?? {
          client: { id: overrides.clientId ?? 1 },
          clientItems: [{ totalValueInCents: 10000, description: 'Item snapshot' }],
        },
      },
    });
  }

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        NfmPersistenceModule,
        ConfigModule,
      ],
      providers: [
        NfmDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(NfmDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.nfm.deleteMany();

    const suffix = String(Date.now()).slice(-8);
    const cnae = await prisma.cnae.create({
      data: { code: `C${suffix}`, description: 'CNAE NFM DAO' },
    });
    const nbs = await prisma.nbs.create({
      data: { code: `N${suffix}`, description: 'NBS NFM DAO' },
    });
    const indop = await prisma.indop.create({
      data: { code: `I${suffix}`, description: 'INDOP NFM DAO' },
    });
    const indop2 = await prisma.indop.create({
      data: { code: `J${suffix}`, description: 'INDOP2 NFM DAO' },
    });

    const corr1 = await prisma.cnaeNbsIndop.create({
      data: {
        cnaeId: cnae.id,
        nbsId: nbs.id,
        indopId: indop.id,
        serviceListItemCode: '01.07',
      },
    });
    const corr2 = await prisma.cnaeNbsIndop.create({
      data: {
        cnaeId: cnae.id,
        nbsId: nbs.id,
        indopId: indop2.id,
        serviceListItemCode: '01.07',
      },
    });
    cnaeNbsIndopId = corr1.id;
    cnaeNbsIndopId2 = corr2.id;
  });

  beforeEach(async() => {
    await prisma.nfm.deleteMany();
    await prisma.nfse.deleteMany();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findById', () => {
    async function createNfse(rpsNumber: number) {
      return prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data: { providerDocument: '12345678000199' },
        },
      });
    }

    it('should return null when not found', async() => {
      const result = await sut.findById(999_999);
      expect(result).toBeNull();
    });

    it('should return dto when nfm has linked nfse', async() => {
      const nfse = await createNfse(50);
      const row = await createNfm({ nfseId: nfse.id });

      const result = await sut.findById(row.id);

      expect(result).toMatchObject({
        id: row.id,
        clientId: 1,
        nfse: { id: nfse.id },
      });
    });

    it('should return nested nfse bank payment fields via findById', async() => {
      const nfse = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: 51,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '9001',
          verificationCode: 'NFM-BP',
          issuedAt: new Date('2026-07-20T10:00:00.000Z'),
          bankPaymentProvider: 'INTER',
          bankPaymentRequestCode: 'nfm-request-code',
          bankPaymentSettledAt: new Date('2026-09-17T12:00:00.000Z'),
          bankPaymentNextSettlementAt: new Date('2026-09-17T18:00:00.000Z'),
          data: { providerDocument: '12345678000199' },
        },
      });
      const row = await createNfm({ nfseId: nfse.id });

      const result = await sut.findById(row.id);

      expect(result?.nfse).toMatchObject({
        id: nfse.id,
        bankPaymentProvider: 'INTER',
        bankPaymentRequestCode: 'nfm-request-code',
        bankPaymentSettledAt: new Date('2026-09-17T12:00:00.000Z'),
        bankPaymentNextSettlementAt: new Date('2026-09-17T18:00:00.000Z'),
      });
    });

    it('should return nfse null when nfm has no linked nfse', async() => {
      const row = await createNfm();

      const result = await sut.findById(row.id);

      expect(result).toMatchObject({ id: row.id, nfse: null });
    });

    it('should return clientItems from the nfm data snapshot', async() => {
      // Arrange
      const nfse = await createNfse(52);
      const snapshotItems = [
        { totalValueInCents: 10000, description: 'Item snapshot' },
        { totalValueInCents: 5500, description: 'Segundo item' },
      ];
      const row = await createNfm({
        nfseId: nfse.id,
        data: { client: { id: 1 }, clientItems: snapshotItems },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result?.clientItems).toEqual(snapshotItems);
    });

    it('should return empty clientItems when snapshot has none', async() => {
      // Arrange
      const nfse = await createNfse(53);
      const row = await createNfm({
        nfseId: nfse.id,
        data: { client: { id: 1 } },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result?.clientItems).toEqual([]);
    });

    it('should return empty clientItems when snapshot clientItems is not an array', async() => {
      // Arrange
      const nfse = await createNfse(54);
      const row = await createNfm({
        nfseId: nfse.id,
        data: { client: { id: 1 }, clientItems: 'invalid' },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result?.clientItems).toEqual([]);
    });
  });

  describe('findAll', () => {
    async function createNfse(rpsNumber: number) {
      return prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data: { providerDocument: '12345678000199' },
        },
      });
    }

    it('should exclude rows without nfseId', async() => {
      await createNfm({ clientId: 1 });
      const nfse = await createNfse(1);
      await createNfm({
        clientId: 2,
        nfseId: nfse.id,
        cnaeNbsIndopId: cnaeNbsIndopId2,
      });

      const [rows, total] = await sut.findAll({});

      expect(total).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0].nfse.id).toBe(nfse.id);
    });

    it('should return clientItems from the nfm data snapshot', async() => {
      // Arrange
      const nfse = await createNfse(2);
      const snapshotItems = [{ totalValueInCents: 4200, description: 'Item lista' }];
      await createNfm({
        clientId: 3,
        nfseId: nfse.id,
        cnaeNbsIndopId: cnaeNbsIndopId2,
        data: { client: { id: 3 }, clientItems: snapshotItems },
      });

      // Act
      const [rows] = await sut.findAll({});

      // Assert
      expect(rows[0].clientItems).toEqual(snapshotItems);
    });

    it('should filter by dateStart and dateEnd on createdAt', async() => {
      const nfseIn = await createNfse(10);
      const nfseOut = await createNfse(11);
      const rowIn = await createNfm({ clientId: 10, nfseId: nfseIn.id });
      const rowOut = await createNfm({
        clientId: 11,
        nfseId: nfseOut.id,
        cnaeNbsIndopId: cnaeNbsIndopId2,
      });

      await prisma.nfm.update({
        where: { id: rowIn.id },
        data: { createdAt: new Date('2026-08-15T12:00:00.000Z') },
      });
      await prisma.nfm.update({
        where: { id: rowOut.id },
        data: { createdAt: new Date('2026-07-01T12:00:00.000Z') },
      });

      const [rows, total] = await sut.findAll({
        dateStart: '2026-08-01',
        dateEnd: '2026-08-31',
      });

      expect(total).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(rowIn.id);
    });

    it('should paginate results', async() => {
      const nfse1 = await createNfse(20);
      const nfse2 = await createNfse(21);
      await createNfm({ clientId: 20, nfseId: nfse1.id });
      await createNfm({
        clientId: 21,
        nfseId: nfse2.id,
        cnaeNbsIndopId: cnaeNbsIndopId2,
      });

      const [rows, total] = await sut.findAll({ page: 1, size: 1 });

      expect(total).toBe(2);
      expect(rows).toHaveLength(1);
    });

    it('should apply dateStart as BRT (UTC-3) midnight, not UTC midnight', async() => {
      const nfse = await createNfse(30);
      const row = await createNfm({ clientId: 30, nfseId: nfse.id });
      await prisma.nfm.update({
        where: { id: row.id },
        data: { createdAt: new Date('2026-08-01T01:00:00.000Z') },
      });

      const [excluded] = await sut.findAll({ dateStart: '2026-08-01' });
      const [included] = await sut.findAll({ dateStart: '2026-07-31' });

      expect(excluded.find((item) => item.id === row.id)).toBeUndefined();
      expect(included.find((item) => item.id === row.id)).toBeDefined();
    });
  });

  describe('findAll - filtros operacionais', () => {
    let rpsSeed = 900;

    async function createNfseWith(data: Record<string, unknown>) {
      rpsSeed += 1;
      return prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: rpsSeed,
          rpsSeries: 'NFSE',
          data: { providerDocument: '12345678000199' },
          ...data,
        } as never,
      });
    }

    it('should filter by nfse status', async() => {
      // Arrange
      const awaiting = await createNfseWith({ status: NfseStatus.AWAITING_PROVIDER });
      const issued = await createNfseWith({ status: NfseStatus.ISSUED });
      const target = await createNfm({ nfseId: awaiting.id });
      await createNfm({ nfseId: issued.id, cnaeNbsIndopId: cnaeNbsIndopId2 });

      // Act
      const [rows, total] = await sut.findAll({ status: NfseStatus.AWAITING_PROVIDER });

      // Assert
      expect(total).toBe(1);
      expect(rows.map((row) => row.id)).toEqual([target.id]);
    });

    it('should filter what is stuck: non terminal and without movement', async() => {
      // Arrange
      const old = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const stuck = await createNfseWith({ status: NfseStatus.SUBMITTED, updatedAt: old });
      const recent = await createNfseWith({ status: NfseStatus.SUBMITTED });
      const issuedLongAgo = await createNfseWith({ status: NfseStatus.ISSUED, updatedAt: old });
      const target = await createNfm({ nfseId: stuck.id });
      await createNfm({ nfseId: recent.id, cnaeNbsIndopId: cnaeNbsIndopId2 });
      await createNfm({ nfseId: issuedLongAgo.id, clientId: 2 });

      // Act
      const [rows, total] = await sut.findAll({ stuckForHours: 2 });

      // Assert — emitida há muito tempo não está presa; ela terminou.
      expect(total).toBe(1);
      expect(rows.map((row) => row.id)).toEqual([target.id]);
    });

    it('should filter issued notes without a linked charge', async() => {
      // Arrange
      const withoutCharge = await createNfseWith({ status: NfseStatus.ISSUED });
      const withCharge = await createNfseWith({ status: NfseStatus.ISSUED, bankPaymentRequestCode: 'req-1' });
      const target = await createNfm({ nfseId: withoutCharge.id });
      await createNfm({ nfseId: withCharge.id, cnaeNbsIndopId: cnaeNbsIndopId2 });

      // Act
      const [rows, total] = await sut.findAll({ missingBankPayment: true });

      // Assert
      expect(total).toBe(1);
      expect(rows.map((row) => row.id)).toEqual([target.id]);
    });

    it('should count the same rows it returns', async() => {
      // Arrange — a contagem incluía linhas que a página descartava depois.
      const nfse = await createNfseWith({ status: NfseStatus.ISSUED });
      await createNfm({ nfseId: nfse.id });
      await createNfm({ cnaeNbsIndopId: cnaeNbsIndopId2 });

      // Act
      const [rows, total] = await sut.findAll({});

      // Assert
      expect(total).toBe(rows.length);
    });
  });
});
