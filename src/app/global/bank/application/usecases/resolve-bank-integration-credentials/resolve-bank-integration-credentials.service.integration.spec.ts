import { Test, TestingModule } from '@nestjs/testing';
import { BankIntegrationNotConfiguredError } from 'src/app/global/bank/domain/errors/bank-integration-not-configured.error';
import { BankNotFoundError } from 'src/app/global/bank/domain/errors/bank-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedConfiguredBank } from 'src/test/fixtures/seed-configured-bank';
import { BankModule } from '../../../bank.module';
import { ResolveBankIntegrationCredentials } from './resolve-bank-integration-credentials.service';

describe('ResolveBankIntegrationCredentials - Integration tests', () => {
  let sut: ResolveBankIntegrationCredentials;
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({ imports: [BankModule] }).compile();
    sut = moduleRef.get(ResolveBankIntegrationCredentials);
    prisma = moduleRef.get(PrismaService);
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

  it('should throw BankNotFoundError when bank does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(BankNotFoundError);
  });

  it('should throw BankIntegrationNotConfiguredError when the bank has no keys', async() => {
    const bank = await prisma.bank.create({
      data: {
        drawer: 'Drawer',
        wallet: '1',
        account: `A${Date.now()}`.slice(0, 20),
        agency: '0001',
        bankCode: `B${Date.now()}`.slice(0, 20),
        bankName: 'Inter',
        paymentLocation: null,
        active: true,
      },
    });

    await expect(sut.execute(bank.id)).rejects.toThrow(BankIntegrationNotConfiguredError);
  });

  it('should decrypt stored credentials', async() => {
    // Arrange
    const { bankId } = await seedConfiguredBank(moduleRef);

    // Act
    const result = await sut.execute(bankId);

    // Assert
    expect(result.bankId).toBe(bankId);
    expect(result.clientId).toBe('client-id');
    expect(result.clientSecret).toBe('client-secret');
    expect(result.apiUrl).toBe('https://cdpj-sandbox.partners.uatinter.co');
    expect(result.certPem).toContain('BEGIN CERTIFICATE');
    expect(result.keyPem).toContain('BEGIN');
  });
});
