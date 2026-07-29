import { Test } from '@nestjs/testing';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseModule } from '../../../nfse.module';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { FindNfseById } from './find-nfse-by-id.service';

describe('FindNfseById - Integration tests', () => {
  let sut: FindNfseById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfseModule],
    }).compile();

    sut = module.get(FindNfseById);
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

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    await expect(sut.execute(999_999)).rejects.toThrow(NfseNotFoundError);
  });

  it('should return the nfse when it exists in the database', async() => {
    // Arrange
    const created = await prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: { providerDocument: '12345678000199' },
      },
    });

    // Act
    const result = await sut.execute(created.id);

    // Assert
    expect(result).toMatchObject({
      id: created.id,
      companyId: 1,
      clientId: 1,
      rpsSeries: 'NFSE',
      status: NfseStatus.PENDING,
    });
  });
});
