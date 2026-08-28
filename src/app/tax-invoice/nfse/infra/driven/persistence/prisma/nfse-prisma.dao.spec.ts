import { Test } from '@nestjs/testing';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseDaoAdapterPrisma } from './nfse-prisma.dao';

describe('NfseDaoAdapterPrisma - Integration tests', () => {
  let sut: NfseDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NfseDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NfseDaoAdapterPrisma);
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

  describe('findById', () => {
    it('should return null when the nfse does not exist', async() => {
      // Act
      const result = await sut.findById(999_999);

      // Assert
      expect(result).toBeNull();
    });

    it('should return the nfse with the complete DTO shape', async() => {
      // Arrange
      const data = { providerDocument: '12345678000199', input: { service: { description: 'Serviço teste' } } };
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: Date.now() % 100_000,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data,
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject<Partial<NfseDto>>({
        id: row.id,
        companyId: 1,
        clientId: 1,
        rpsNumber: row.rpsNumber,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        batchProtocol: null,
        nfseNumber: null,
        verificationCode: null,
        issuedAt: null,
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        bankPaymentProvider: null,
        bankPaymentRequestCode: null,
        data,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return canceled fields via findById after cancellation', async() => {
      // Arrange
      const canceledAt = new Date('2026-07-29T15:30:00.000Z');
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: Date.now() % 100_000,
          rpsSeries: 'NFSE',
          status: NfseStatus.CANCELED,
          nfseNumber: '1001',
          verificationCode: 'XYZ999',
          issuedAt,
          canceledAt,
          cancelReasonCode: 4,
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.CANCELED,
        nfseNumber: '1001',
        canceledAt,
        cancelReasonCode: 4,
      });
    });

    it('should return ISSUED fields via findById', async() => {
      // Arrange
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 1,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '2002',
          verificationCode: 'VER-ABC',
          issuedAt,
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.ISSUED,
        nfseNumber: '2002',
        verificationCode: 'VER-ABC',
        issuedAt,
      });
    });

    it('should return bank payment fields via findById', async() => {
      // Arrange
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 10,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '2003',
          verificationCode: 'VER-BP',
          issuedAt,
          bankPaymentProvider: 'INTER',
          bankPaymentRequestCode: 'request-dao-1',
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        bankPaymentProvider: 'INTER',
        bankPaymentRequestCode: 'request-dao-1',
      });
    });

    it('should return SUBMITTED fields via findById', async() => {
      // Arrange
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 2,
          rpsSeries: 'NFSE',
          status: NfseStatus.SUBMITTED,
          batchProtocol: 'protocol-xyz',
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.SUBMITTED,
        batchProtocol: 'protocol-xyz',
      });
    });

    it('should return FAILED fields via findById', async() => {
      // Arrange
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 3,
          rpsSeries: 'NFSE',
          status: NfseStatus.FAILED,
          errorMessage: 'Lote rejeitado pelo Giss',
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.FAILED,
        errorMessage: 'Lote rejeitado pelo Giss',
      });
    });

    it('should return PROCESSING status via findById', async() => {
      // Arrange
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 4,
          rpsSeries: 'NFSE',
          status: NfseStatus.PROCESSING,
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.PROCESSING,
      });
    });

    it('should preserve UTF-8 characters in data JSON', async() => {
      // Arrange
      const data = {
        tomador: { nome: 'João da Silva', endereço: 'Rua Açúcar, nº 10 — São Paulo' },
        serviço: { descrição: 'Consultoria técnica' },
      };
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 5,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data,
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result?.data).toEqual(data);
    });
  });
});
