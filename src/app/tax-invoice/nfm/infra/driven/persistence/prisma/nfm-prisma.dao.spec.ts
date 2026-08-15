import { Test } from '@nestjs/testing';
import { NfmStatus } from 'src/app/tax-invoice/nfm/domain/enums/nfm-status.enum';
import { NfmPersistenceModule } from 'src/app/tax-invoice/nfm/application/persistence/nfm-persistence.module';
import { SaveNfmData } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
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
      status: NfmStatus.PENDING,
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
      expect(result).toEqual({ id, nfseId: null, status: NfmStatus.PENDING });
    });
  });

  describe('edit', () => {
    it('should update status and nfseId', async() => {
      // Arrange
      const id = await sut.save(makeSaveNfmData());

      // Act
      await sut.edit(id, { status: NfmStatus.FAILED, nfseId: null });

      // Assert
      const saved = await prisma.nfm.findUnique({ where: { id } });
      expect(saved?.status).toBe(NfmStatus.FAILED);
      expect(saved?.nfseId).toBeNull();
    });
  });
});
