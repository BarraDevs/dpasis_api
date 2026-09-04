import { Test } from '@nestjs/testing';
import { NfmPersistenceModule } from 'src/app/tax-invoice/nfm/application/persistence/nfm-persistence.module';
import { NfmFactory } from 'src/app/tax-invoice/nfm/domain/factories/nfm.factory';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfmRepositoryAdapterPrisma } from './nfm-prisma.repository';

describe('NfmRepositoryAdapterPrisma - Integration tests', () => {
  let sut: NfmRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let cnaeNbsIndopId: number;
  let cnaeNbsIndopId2: number;

  function makeEntity(overrides: {
    clientId?: number;
    cnaeNbsIndopId?: number;
    referenceMonth?: number;
    referenceYear?: number;
  } = {}) {
    const now = new Date();
    return NfmFactory.create({
      clientId: overrides.clientId ?? 1,
      clientDocument: '00000000000101',
      companyName: 'Empresa Teste',
      referenceMonth: overrides.referenceMonth ?? now.getMonth() + 1,
      referenceYear: overrides.referenceYear ?? now.getFullYear(),
      totalValueInCents: 10000,
      cnaeNbsIndopId: overrides.cnaeNbsIndopId ?? cnaeNbsIndopId,
      data: {
        client: { id: overrides.clientId ?? 1 },
        clientItems: [{ totalValueInCents: 10000 }],
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
        NfmRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(NfmRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.nfm.deleteMany();

    const suffix = String(Date.now()).slice(-8);
    const cnae = await prisma.cnae.create({
      data: { code: `R${suffix}`, description: 'CNAE NFM REPO' },
    });
    const nbs = await prisma.nbs.create({
      data: { code: `R${suffix}`, description: 'NBS NFM REPO' },
    });
    const indop = await prisma.indop.create({
      data: { code: `R${suffix}`, description: 'INDOP NFM REPO' },
    });
    const indop2 = await prisma.indop.create({
      data: { code: `S${suffix}`, description: 'INDOP2 NFM REPO' },
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

  describe('save', () => {
    it('should persist row without nfse and return id', async() => {
      const entity = makeEntity();

      const id = await sut.save(entity);

      expect(id).toBeGreaterThan(0);
      const saved = await prisma.nfm.findUnique({ where: { id } });
      expect(saved?.cnaeNbsIndopId).toBe(cnaeNbsIndopId);
      expect(saved?.nfseId).toBeNull();
    });

    it('should allow two rows for same client/month/year with different cnaeNbsIndopId', async() => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await sut.save(makeEntity({ cnaeNbsIndopId, referenceMonth: month, referenceYear: year }));
      await sut.save(makeEntity({ cnaeNbsIndopId: cnaeNbsIndopId2, referenceMonth: month, referenceYear: year }));

      expect(await prisma.nfm.count()).toBe(2);
    });

    it('should reject duplicate save for same client/month/year/cnae', async() => {
      const entity = makeEntity({ referenceMonth: 3, referenceYear: 2026 });

      await sut.save(entity);

      await expect(sut.save(makeEntity({ referenceMonth: 3, referenceYear: 2026 }))).rejects.toThrow();
      expect(await prisma.nfm.count()).toBe(1);
    });
  });

  describe('edit', () => {
    it('should persist nfseId after linkNfse', async() => {
      const id = await sut.save(makeEntity());
      const nfseRow = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: 99,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data: { providerDocument: '12345678000199' },
        },
      });

      const nfm = await sut.findById(id);
      expect(nfm).not.toBeNull();
      const nfse = NfseFactory.load({
        id: nfseRow.id,
        companyId: nfseRow.companyId,
        clientId: nfseRow.clientId,
        rpsNumber: nfseRow.rpsNumber,
        rpsSeries: nfseRow.rpsSeries,
        status: nfseRow.status as NfseStatus,
        batchProtocol: null,
        nfseNumber: null,
        verificationCode: null,
        issuedAt: null,
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        bankPaymentProvider: null,
        bankPaymentRequestCode: null,
        bankPaymentIdempotencyKey: null,
        bankPaymentRequestedAt: null,
        bankPaymentErrorMessage: null,
        bankPaymentFailedAt: null,
        nfmId: null,
        data: nfseRow.data as Record<string, unknown>,
      });
      nfm!.linkNfse(nfse);
      await sut.edit(nfm!);

      const saved = await prisma.nfm.findUnique({ where: { id } });
      expect(saved?.nfseId).toBe(nfseRow.id);
    });
  });

  describe('findById', () => {
    it('should return null when not found', async() => {
      const result = await sut.findById(999_999);
      expect(result).toBeNull();
    });

    it('should rehydrate Nfm with nested Nfse', async() => {
      const nfseRow = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: 50,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '9001',
          verificationCode: 'ABC',
          issuedAt: new Date('2026-07-20T10:00:00.000Z'),
          data: { providerDocument: '12345678000199' },
        },
      });
      const entity = makeEntity();
      entity.linkNfse(NfseFactory.load({
        id: nfseRow.id,
        companyId: 1,
        clientId: 1,
        rpsNumber: 50,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        batchProtocol: null,
        nfseNumber: '9001',
        verificationCode: 'ABC',
        issuedAt: new Date('2026-07-20T10:00:00.000Z'),
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        bankPaymentProvider: null,
        bankPaymentRequestCode: null,
        bankPaymentIdempotencyKey: null,
        bankPaymentRequestedAt: null,
        bankPaymentErrorMessage: null,
        bankPaymentFailedAt: null,
        nfmId: null,
        data: { providerDocument: '12345678000199' },
      }));
      const id = await sut.save(entity);

      const result = await sut.findById(id);

      expect(result?.props.id).toBe(id);
      expect(result?.props.nfse?.props.id).toBe(nfseRow.id);
      expect(result?.props.nfse?.props.status).toBe(NfseStatus.ISSUED);
    });

    it('should rehydrate Nfm without nfse', async() => {
      const id = await sut.save(makeEntity());

      const result = await sut.findById(id);

      expect(result?.props.id).toBe(id);
      expect(result?.hasNfse()).toBe(false);
    });
  });

  describe('findByClientReferenceAndCnae', () => {
    it('should return null when not found', async() => {
      const result = await sut.findByClientReferenceAndCnae(1, 1, 2026, cnaeNbsIndopId);
      expect(result).toBeNull();
    });

    it('should return entity for unique compound key', async() => {
      const entity = makeEntity({ referenceMonth: 8, referenceYear: 2026 });
      const id = await sut.save(entity);

      const result = await sut.findByClientReferenceAndCnae(1, 8, 2026, cnaeNbsIndopId);

      expect(result?.props.id).toBe(id);
      expect(result?.hasNfse()).toBe(false);
    });
  });
});
