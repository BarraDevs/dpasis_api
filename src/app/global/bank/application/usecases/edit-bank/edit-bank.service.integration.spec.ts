import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BankModule } from '../../../bank.module';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { EditBankInputDto } from './dtos/edit-bank.dto';
import { EditBank } from './edit-bank.service';

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

describe('EditBank - Integration tests', () => {
  let sut: EditBank;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BankModule],
    }).compile();

    sut = module.get(EditBank);
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
    const data: EditBankInputDto = {
      ...baseBankData,
      bankName: 'Santander',
    };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(BankNotFoundError);
  });

  it('should update bank fields', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });
    const data: EditBankInputDto = {
      drawer: 'Nova Empresa',
      wallet: '456',
      account: '54321-0',
      agency: '0002',
      bankCode: '033',
      bankName: 'Santander',
      paymentLocation: null,
    };

    // Act
    await sut.execute(bank.id, data);

    // Assert
    const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(updated?.drawer).toBe('Nova Empresa');
    expect(updated?.wallet).toBe('456');
    expect(updated?.account).toBe('54321-0');
    expect(updated?.agency).toBe('0002');
    expect(updated?.bankCode).toBe('033');
    expect(updated?.bankName).toBe('Santander');
    expect(updated?.paymentLocation).toBe(null);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });
    const data: EditBankInputDto = {
      ...baseBankData,
      bankName: 'Santander',
    };

    // Act
    const result = await sut.execute(bank.id, data);

    // Assert
    expect(result).toEqual({ message: 'Banco atualizado com sucesso' });
  });

  it('should throw BankAlreadyExistsError when editing to duplicate bankCode, agency and account', async() => {
    // Arrange
    await prisma.bank.create({
      data: baseBankData,
    });
    const bankB = await prisma.bank.create({
      data: {
        ...baseBankData,
        bankCode: '033',
        agency: '0002',
        account: '65432-1',
      },
    });
    const data: EditBankInputDto = {
      ...baseBankData,
      bankName: 'Banco B atualizado',
    };

    // Act & Assert
    await expect(sut.execute(bankB.id, data)).rejects.toThrow(BankAlreadyExistsError);
  });

  it('should allow edit when bankCode, agency and account belong to the same bank being edited', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });
    const data: EditBankInputDto = {
      ...baseBankData,
      bankName: 'Banco do Brasil - Atualizado',
    };

    // Act
    await sut.execute(bank.id, data);

    // Assert
    const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(updated?.bankCode).toBe('001');
    expect(updated?.agency).toBe('0001');
    expect(updated?.account).toBe('12345-6');
    expect(updated?.bankName).toBe('Banco do Brasil - Atualizado');
    expect(updated?.active).toBe(true);
  });

  it('should update paymentLocation', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });
    const data: EditBankInputDto = {
      ...baseBankData,
      paymentLocation: 'Pagável em qualquer banco',
    };

    // Act
    await sut.execute(bank.id, data);

    // Assert
    const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(updated?.paymentLocation).toBe('Pagável em qualquer banco');
  });
});
