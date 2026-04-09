import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BankModule } from '../../../bank.module';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { UpdateBankStatus } from './update-bank-status.service';

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

describe('UpdateBankStatus - Integration tests', () => {
  let sut: UpdateBankStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BankModule],
    }).compile();

    sut = module.get(UpdateBankStatus);
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
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });

    // Act
    await sut.execute(bank.id);

    // Assert
    const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: { ...baseBankData, active: false },
    });

    // Act
    await sut.execute(bank.id);

    // Assert
    const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });

    // Act
    const result = await sut.execute(bank.id);

    // Assert
    expect(result).toEqual({ message: 'Status do banco atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });

    // Act
    await sut.execute(bank.id);

    // Assert
    const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(updated?.drawer).toBe(baseBankData.drawer);
    expect(updated?.wallet).toBe(baseBankData.wallet);
    expect(updated?.account).toBe(baseBankData.account);
    expect(updated?.agency).toBe(baseBankData.agency);
    expect(updated?.bankCode).toBe(baseBankData.bankCode);
    expect(updated?.bankName).toBe(baseBankData.bankName);
    expect(updated?.active).toBe(false);
  });
});
