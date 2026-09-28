import { Test } from '@nestjs/testing';
import { BankModule } from '../../../bank.module';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { RotateBankWebhookToken } from './rotate-bank-webhook-token.service';

describe('RotateBankWebhookToken - Integration tests', () => {
  let sut: RotateBankWebhookToken;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({ imports: [BankModule] }).compile();
    sut = module.get(RotateBankWebhookToken);
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

  it('should throw BankNotFoundError when bank does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(BankNotFoundError);
  });

  it('should persist a new hash different from the previous one', async() => {
    // Arrange
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
        webhookTokenHash: 'a'.repeat(64),
      },
    });

    // Act
    const result = await sut.execute(bank.id);

    // Assert
    expect(result.webhookToken).toEqual(expect.any(String));
    const saved = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(saved?.webhookTokenHash).toHaveLength(64);
    expect(saved?.webhookTokenHash).not.toBe('a'.repeat(64));
  });
});
