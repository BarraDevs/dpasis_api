import { Test } from '@nestjs/testing';
import { NfmPersistenceModule } from 'src/app/tax-invoice/nfm/application/persistence/nfm-persistence.module';
import { SaveNfmData } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { NfmNfseMissingError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-nfse-missing.error';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfmDaoAdapterPrisma } from './nfm-prisma.dao';

describe('NfmDaoAdapterPrisma', () => {
  let sut: NfmDaoAdapterPrisma;
  let prisma: PrismaService;
  let cnaeNbsIndopId: number;
  let cnaeNbsIndopId2: number;

  function makeSaveNfmData(overrides: Partial<SaveNfmData> = {}): SaveNfmData {
    const now = new Date();
    return {
      clientId: 1,
      clientDocument: '00000000000101',
      companyName: 'Empresa Teste',
      referenceMonth: now.getMonth() + 1,
      referenceYear: now.getFullYear(),
      totalValueInCents: 10000,
      cnaeNbsIndopId,
      data: {
        client: { id: 1, document: '00000000000101', companyName: 'Empresa Teste' },
        clientInvoiceConfig: { clientId: 1 },
        clientItems: [{ totalValueInCents: 10000 }],
      } as SaveNfmData['data'],
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

  describe('save', () => {
    it('should persist row and return id', async() => {
      // Arrange
      const row = makeSaveNfmData();

      // Act
      const id = await sut.save(row);

      // Assert
      expect(id).toBeGreaterThan(0);
      const saved = await prisma.nfm.findUnique({ where: { id } });
      expect(saved?.cnaeNbsIndopId).toBe(cnaeNbsIndopId);
      expect(saved?.nfseId).toBeNull();
    });

    it('should allow two rows for same client/month/year with different cnaeNbsIndopId', async() => {
      // Arrange
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Act
      await sut.save(makeSaveNfmData({ cnaeNbsIndopId, referenceMonth: month, referenceYear: year }));
      await sut.save(makeSaveNfmData({ cnaeNbsIndopId: cnaeNbsIndopId2, referenceMonth: month, referenceYear: year }));

      // Assert
      expect(await prisma.nfm.count()).toBe(2);
    });
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
      // Act
      const result = await sut.findById(999_999);

      // Assert
      expect(result).toBeNull();
    });

    it('should return dto when nfm has linked nfse', async() => {
      // Arrange
      const nfse = await createNfse(50);
      const id = await sut.save(makeSaveNfmData({ nfseId: nfse.id }));

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toMatchObject({
        id,
        clientId: 1,
        nfse: { id: nfse.id },
      });
    });

    it('should return nested nfse bank payment fields via findById', async() => {
      // Arrange
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
          data: { providerDocument: '12345678000199' },
        },
      });
      const id = await sut.save(makeSaveNfmData({ nfseId: nfse.id }));

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result?.nfse).toMatchObject({
        id: nfse.id,
        bankPaymentProvider: 'INTER',
        bankPaymentRequestCode: 'nfm-request-code',
      });
    });

    it('should throw NfmNfseMissingError when nfm has no linked nfse', async() => {
      // Arrange
      const id = await sut.save(makeSaveNfmData());

      // Act & Assert
      await expect(sut.findById(id)).rejects.toThrow(NfmNfseMissingError);
    });
  });

  describe('findByClientReferenceAndCnae', () => {
    it('should return null when not found', async() => {
      // Act
      const result = await sut.findByClientReferenceAndCnae(1, 1, 2026, cnaeNbsIndopId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return persisted row', async() => {
      // Arrange
      const row = makeSaveNfmData({ referenceMonth: 8, referenceYear: 2026 });
      const id = await sut.save(row);

      // Act
      const result = await sut.findByClientReferenceAndCnae(1, 8, 2026, cnaeNbsIndopId);

      // Assert
      expect(result).toEqual({ id, nfseId: null });
    });
  });

  describe('edit', () => {
    it('should update nfseId', async() => {
      // Arrange
      const id = await sut.save(makeSaveNfmData());
      const nfse = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: 99,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data: { providerDocument: '12345678000199' },
        },
      });

      // Act
      await sut.edit(id, { nfseId: nfse.id });

      // Assert
      const saved = await prisma.nfm.findUnique({ where: { id } });
      expect(saved?.nfseId).toBe(nfse.id);
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
      // Arrange
      await sut.save(makeSaveNfmData({ clientId: 1 }));
      const nfse = await createNfse(1);
      await sut.save(makeSaveNfmData({
        clientId: 2,
        nfseId: nfse.id,
        cnaeNbsIndopId: cnaeNbsIndopId2,
      }));

      // Act
      const [rows, total] = await sut.findAll({});

      // Assert
      expect(total).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0].nfse.id).toBe(nfse.id);
    });

    it('should filter by dateStart and dateEnd on createdAt', async() => {
      // Arrange
      const nfseIn = await createNfse(10);
      const nfseOut = await createNfse(11);
      const idIn = await sut.save(makeSaveNfmData({ clientId: 10, nfseId: nfseIn.id }));
      const idOut = await sut.save(makeSaveNfmData({
        clientId: 11,
        nfseId: nfseOut.id,
        cnaeNbsIndopId: cnaeNbsIndopId2,
      }));

      await prisma.nfm.update({
        where: { id: idIn },
        data: { createdAt: new Date('2026-08-15T12:00:00.000Z') },
      });
      await prisma.nfm.update({
        where: { id: idOut },
        data: { createdAt: new Date('2026-07-01T12:00:00.000Z') },
      });

      // Act
      const [rows, total] = await sut.findAll({
        dateStart: '2026-08-01',
        dateEnd: '2026-08-31',
      });

      // Assert
      expect(total).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(idIn);
    });

    it('should paginate results', async() => {
      // Arrange
      const nfse1 = await createNfse(20);
      const nfse2 = await createNfse(21);
      await sut.save(makeSaveNfmData({ clientId: 20, nfseId: nfse1.id }));
      await sut.save(makeSaveNfmData({
        clientId: 21,
        nfseId: nfse2.id,
        cnaeNbsIndopId: cnaeNbsIndopId2,
      }));

      // Act
      const [rows, total] = await sut.findAll({ page: 1, size: 1 });

      // Assert
      expect(total).toBe(2);
      expect(rows).toHaveLength(1);
    });

    it('should apply dateStart as BRT (UTC-3) midnight, not UTC midnight', async() => {
      // Arrange: 2026-08-01T01:00:00Z is 2026-07-31 22:00 BRT, i.e. still July 31st in Brazil.
      const nfse = await createNfse(30);
      const id = await sut.save(makeSaveNfmData({ clientId: 30, nfseId: nfse.id }));
      await prisma.nfm.update({
        where: { id },
        data: { createdAt: new Date('2026-08-01T01:00:00.000Z') },
      });

      // Act
      const [excluded] = await sut.findAll({ dateStart: '2026-08-01' });
      const [included] = await sut.findAll({ dateStart: '2026-07-31' });

      // Assert
      expect(excluded.find((row) => row.id === id)).toBeUndefined();
      expect(included.find((row) => row.id === id)).toBeDefined();
    });

    it('should throw NfmNfseMissingError when a matched row has no linked nfse', async() => {
      // Arrange
      jest.spyOn(prisma, '$transaction').mockResolvedValueOnce([
        [{
          id: 999,
          clientId: 1,
          clientDocument: '00000000000101',
          companyName: 'Empresa Teste',
          referenceMonth: 8,
          referenceYear: 2026,
          totalValueInCents: 10000,
          cnaeNbsIndopId,
          createdAt: new Date(),
          updatedAt: new Date(),
          nfse: null,
        }],
        1,
      ] as any);

      // Act & Assert
      await expect(sut.findAll({})).rejects.toThrow(NfmNfseMissingError);
    });
  });
});
