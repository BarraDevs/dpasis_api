import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BankModule } from '../../../bank.module';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { BankDto } from '../../dtos/bank.dto';
import { FindBankById } from './find-bank-by-id.service';
import { UNCONFIGURED_BANK_INTEGRATION } from 'src/test/fixtures/unconfigured-bank-dto';

const baseBankData = {
  drawer: 'Empresa XYZ',
  wallet: '123',
  account: '12345-6',
  agency: '0001',
  bankCode: '001',
  bankName: 'Banco do Brasil',
  paymentLocation: null as string | null,
  active: true,
};

describe('FindBankById - Integration tests', () => {
  let sut: FindBankById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BankModule],
    }).compile();

    sut = module.get(FindBankById);
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
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(BankNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Banco não encontrado na base de dados.');
  });

  it('should throw BankNotFoundError when bank is inactive and onlyActive is true', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: { ...baseBankData, active: false },
    });

    // Act & Assert
    await expect(sut.execute(bank.id, { onlyActive: true })).rejects.toThrow(BankNotFoundError);
    await expect(sut.execute(bank.id, { onlyActive: true })).rejects.toThrow('Banco não encontrado na base de dados.');
  });

  it('should return bank by id', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });

    // Act
    const result = await sut.execute(bank.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(bank.id);
    expect(result.bankCode).toBe(bank.bankCode);
    expect(result.bankName).toBe(bank.bankName);
    expect(result.active).toBe(bank.active);
  });

  it('should return all bank fields correctly', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: { ...baseBankData, paymentLocation: 'Local de pagamento' },
    });

    // Act
    const result = await sut.execute(bank.id);

    // Assert
    expect(result).toEqual<BankDto>({
      id: bank.id,
      drawer: bank.drawer,
      wallet: bank.wallet,
      account: bank.account,
      agency: bank.agency,
      bankCode: bank.bankCode,
      bankName: bank.bankName,
      paymentLocation: bank.paymentLocation,
      fineRate: null,
      moraRate: null,
      ...UNCONFIGURED_BANK_INTEGRATION,
      active: bank.active,
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
    });
  });

  it('should return inactive bank when onlyActive is false', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: { ...baseBankData, active: false },
    });

    // Act
    const result = await sut.execute(bank.id, { onlyActive: false });

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(bank.id);
    expect(result.active).toBe(false);
  });
});
