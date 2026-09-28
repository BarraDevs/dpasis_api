import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BankModule } from '../../../bank.module';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import { CreateBank } from './create-bank.service';
import { CreateBankInputDto } from './dtos/create-bank.dto';

const baseInput: CreateBankInputDto = {
  drawer: 'Empresa XYZ Ltda',
  wallet: '123',
  account: '12345-6',
  agency: '0001',
  bankCode: '001',
  bankName: 'Banco do Brasil',
  paymentLocation: null,
};

describe('CreateBank - Integration tests', () => {
  let sut: CreateBank;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BankModule],
    }).compile();

    sut = module.get(CreateBank);
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

  it('should throw BankAlreadyExistsError when creating with duplicate bankCode, agency and account', async() => {
    // Arrange
    const input: CreateBankInputDto = { ...baseInput };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(BankAlreadyExistsError);
  });

  it('should create bank and return id', async() => {
    // Arrange
    const input: CreateBankInputDto = { ...baseInput, paymentLocation: null };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.bank.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved).toMatchObject({
      id: result.id,
      drawer: input.drawer,
      wallet: input.wallet,
      account: input.account,
      agency: input.agency,
      bankCode: input.bankCode,
      bankName: input.bankName,
      paymentLocation: null,
      fineRate: null,
      moraRate: null,
      apiUrl: null,
      clientIdCiphertext: null,
      clientSecretCiphertext: null,
      active: true,
    });
  });

  it('should create bank with optional paymentLocation', async() => {
    // Arrange
    const input: CreateBankInputDto = {
      ...baseInput,
      paymentLocation: 'Pagável em qualquer banco até o vencimento',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    const saved = await prisma.bank.findUnique({ where: { id: result.id } });
    expect(saved?.paymentLocation).toBe(input.paymentLocation);
  });

  it('should allow creating bank with same bankCode but different agency/account', async() => {
    // Arrange
    const input1: CreateBankInputDto = { ...baseInput };
    const input2: CreateBankInputDto = {
      ...baseInput,
      agency: '0002',
      account: '65432-1',
    };

    // Act
    const result1 = await sut.execute(input1);
    const result2 = await sut.execute(input2);

    // Assert
    expect(result1.id).not.toBe(result2.id);
    const banks = await prisma.bank.findMany();
    expect(banks).toHaveLength(2);
  });

  it('should encrypt client keys and return a generated webhook token', async() => {
    // Arrange
    const input: CreateBankInputDto = {
      ...baseInput,
      apiUrl: 'https://cdpj.partners.bancointer.com.br',
      clientId: 'inter-client-id',
      clientSecret: 'inter-client-secret',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.webhookToken).toEqual(expect.any(String));
    expect(result.webhookToken!.length).toBeGreaterThanOrEqual(16);

    const saved = await prisma.bank.findUnique({ where: { id: result.id } });
    expect(saved?.apiUrl).toBe(input.apiUrl);
    expect(saved?.clientIdHint).toBe('t-id');
    expect(saved?.clientIdCiphertext).toBeTruthy();
    expect(saved?.clientIdCiphertext).not.toContain('inter-client-id');
    expect(saved?.clientSecretCiphertext).toBeTruthy();
    expect(saved?.webhookTokenHash).toHaveLength(64);
  });
});

