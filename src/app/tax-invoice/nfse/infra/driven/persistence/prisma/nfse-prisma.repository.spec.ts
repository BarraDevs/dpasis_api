import { Test } from '@nestjs/testing';
import { NfseCreateProps } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseRepositoryAdapterPrisma } from './nfse-prisma.repository';

function makeNfseCreateProps(overrides: Partial<NfseCreateProps> = {}): NfseCreateProps {
  return {
    companyId: 1,
    clientId: 1,
    rpsNumber: Date.now() % 100_000,
    rpsSeries: 'NFSE',
    data: { providerDocument: '12345678000199', input: { service: { description: 'Serviço teste' } } },
    ...overrides,
  };
}

describe('NfseRepositoryAdapterPrisma - Integration tests', () => {
  let sut: NfseRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NfseRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NfseRepositoryAdapterPrisma);
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

  describe('save', () => {
    it('should persist the nfse with PENDING status and return the id', async() => {
      // Arrange
      const props = makeNfseCreateProps();
      const entity = NfseFactory.create(props);

      // Act
      const id = await sut.save(entity);

      // Assert
      expect(typeof id).toBe('number');

      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        companyId: props.companyId,
        clientId: props.clientId,
        rpsNumber: props.rpsNumber,
        rpsSeries: props.rpsSeries,
        status: NfseStatus.PENDING,
        data: props.data,
      });
    });

    it('should reject duplicate companyId + rpsSeries + rpsNumber', async() => {
      // Arrange
      const props = makeNfseCreateProps({ rpsNumber: 42_001 });
      await sut.save(NfseFactory.create(props));

      // Act & Assert
      await expect(sut.save(NfseFactory.create(props))).rejects.toThrow();
    });

    it('should persist empty data object', async() => {
      // Arrange
      const props = makeNfseCreateProps({ data: {} });
      const entity = NfseFactory.create(props);

      // Act
      const id = await sut.save(entity);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved?.data).toEqual({});
    });
  });

  describe('findById', () => {
    it('should return null when the nfse does not exist', async() => {
      // Act
      const result = await sut.findById(999_999);

      // Assert
      expect(result).toBeNull();
    });

    it('should rehydrate the nfse entity via Factory', async() => {
      // Arrange
      const props = makeNfseCreateProps();
      const id = await sut.save(NfseFactory.create(props));

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result?.props).toMatchObject({
        id,
        companyId: props.companyId,
        clientId: props.clientId,
        rpsNumber: props.rpsNumber,
        rpsSeries: props.rpsSeries,
        status: NfseStatus.PENDING,
        batchProtocol: null,
        nfseNumber: null,
        verificationCode: null,
        issuedAt: null,
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        data: props.data,
      });
    });

    it('should rehydrate ISSUED fields via findById', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const entity = await sut.findById(id);
      entity!.markIssued('3003', 'ISS-XYZ', issuedAt);
      await sut.edit(entity!);

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result?.props).toMatchObject({
        status: NfseStatus.ISSUED,
        nfseNumber: '3003',
        verificationCode: 'ISS-XYZ',
        issuedAt,
      });
    });
  });

  describe('edit', () => {
    it('should persist status fields after markSubmitted', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const entity = await sut.findById(id);
      entity!.markSubmitted('protocol-123');

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.SUBMITTED,
        batchProtocol: 'protocol-123',
      });
    });

    it('should persist FAILED status with errorMessage', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const entity = await sut.findById(id);
      entity!.markFailed('Lote rejeitado pelo Giss');

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.FAILED,
        errorMessage: 'Lote rejeitado pelo Giss',
      });
    });

    it('should persist CANCELED status with canceledAt and cancelReasonCode', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const canceledAt = new Date('2026-07-29T12:00:00.000Z');

      let entity = await sut.findById(id);
      entity!.markIssued('1000', 'ABC123', issuedAt);
      await sut.edit(entity!);

      entity = await sut.findById(id);
      entity!.markCanceled(canceledAt, 2);

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.CANCELED,
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issuedAt,
        canceledAt,
        cancelReasonCode: 2,
      });
    });

    it('should return canceled fields via findById after cancellation', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const canceledAt = new Date('2026-07-29T15:30:00.000Z');

      let entity = await sut.findById(id);
      entity!.markIssued('1001', 'XYZ999', new Date('2026-07-20T10:00:00.000Z'));
      await sut.edit(entity!);

      entity = await sut.findById(id);
      entity!.markCanceled(canceledAt, 4);
      await sut.edit(entity!);

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result?.props).toMatchObject({
        status: NfseStatus.CANCELED,
        nfseNumber: '1001',
        canceledAt,
        cancelReasonCode: 4,
      });
    });

    it('should persist ISSUED status after markIssued', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const entity = await sut.findById(id);
      entity!.markIssued('4004', 'VER-4004', issuedAt);

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.ISSUED,
        nfseNumber: '4004',
        verificationCode: 'VER-4004',
        issuedAt,
      });
    });

    it('should persist PROCESSING status after markProcessing', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const entity = await sut.findById(id);
      entity!.markProcessing();

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.PROCESSING,
      });
    });

    it('should not mutate companyId, clientId or rps fields on edit', async() => {
      // Arrange
      const props = makeNfseCreateProps({
        companyId: 7,
        clientId: 8,
        rpsNumber: 55_001,
        rpsSeries: 'A1',
      });
      const id = await sut.save(NfseFactory.create(props));
      const entity = await sut.findById(id);
      entity!.markSubmitted('protocol-immutable');

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        companyId: 7,
        clientId: 8,
        rpsNumber: 55_001,
        rpsSeries: 'A1',
        status: NfseStatus.SUBMITTED,
        batchProtocol: 'protocol-immutable',
      });
    });

    it('should reject edit when the nfse id does not exist', async() => {
      // Arrange
      const entity = NfseFactory.load({
        id: 999_999,
        companyId: 1,
        clientId: 1,
        rpsNumber: 1,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        batchProtocol: null,
        nfseNumber: null,
        verificationCode: null,
        issuedAt: null,
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        data: {},
      });
      entity.markSubmitted('protocol-missing');

      // Act & Assert
      await expect(sut.edit(entity)).rejects.toThrow();
    });
  });
});
