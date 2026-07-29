import { Test } from '@nestjs/testing';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { NfseCreateProps } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseDaoAdapterPrisma } from './nfse-prisma.dao';

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
      const props = makeNfseCreateProps();
      const id = await sut.save(props);

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toMatchObject<Partial<NfseDto>>({
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
        data: props.data,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('save', () => {
    it('should persist the nfse with PENDING status and return the id', async() => {
      // Arrange
      const props = makeNfseCreateProps();

      // Act
      const id = await sut.save(props);

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
      await sut.save(props);

      // Act & Assert
      await expect(sut.save(props)).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should persist all provided status fields', async() => {
      // Arrange
      const id = await sut.save(makeNfseCreateProps());
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');

      // Act
      await sut.updateStatus(id, {
        status: NfseStatus.ISSUED,
        batchProtocol: 'protocol-123',
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issuedAt,
        errorMessage: null,
      });

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.ISSUED,
        batchProtocol: 'protocol-123',
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issuedAt,
        errorMessage: null,
      });
    });

    it('should update only the provided fields', async() => {
      // Arrange
      const id = await sut.save(makeNfseCreateProps());
      await sut.updateStatus(id, {
        status: NfseStatus.SUBMITTED,
        batchProtocol: 'protocol-456',
      });

      // Act
      await sut.updateStatus(id, { status: NfseStatus.PROCESSING });

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.PROCESSING,
        batchProtocol: 'protocol-456',
        nfseNumber: null,
        verificationCode: null,
        issuedAt: null,
        errorMessage: null,
      });
    });
  });
});
