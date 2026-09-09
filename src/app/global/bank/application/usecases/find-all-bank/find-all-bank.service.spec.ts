import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BankModule } from '../../../bank.module';
import { BankDto } from '../../dtos/bank.dto';
import { FindAllBankQueryDto } from './dtos/find-all-bank.dto';
import { FindAllBank } from './find-all-bank.service';

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

describe('FindAllBank - Integration tests', () => {
  let sut: FindAllBank;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BankModule],
    }).compile();

    sut = module.get(FindAllBank);
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

  it('should return empty results when no banks exist', async() => {
    // Arrange
    const query: FindAllBankQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all banks with pagination', async() => {
    // Arrange
    await prisma.bank.createMany({
      data: [
        baseBankData,
        { ...baseBankData, bankCode: '033', bankName: 'Santander', agency: '0002', account: '65432-1' },
        { ...baseBankData, bankCode: '341', bankName: 'Itaú', agency: '0003', account: '11111-1' },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    // Arrange
    await prisma.bank.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        ...baseBankData,
        bankCode: String(i + 1).padStart(3, '0'),
        agency: String(i + 1).padStart(4, '0'),
        account: `${10000 + i}-${i}`,
      })),
    });

    // Act
    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    // Assert
    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by bankName asc', async() => {
    // Arrange
    const first = await prisma.bank.create({
      data: { ...baseBankData, bankName: 'Banco B', agency: '0001', account: '11111-1' },
    });
    const second = await prisma.bank.create({
      data: { ...baseBankData, bankName: 'Banco A', agency: '0002', account: '22222-2' },
    });
    const third = await prisma.bank.create({
      data: { ...baseBankData, bankName: 'Banco C', agency: '0003', account: '33333-3' },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    // Arrange
    await prisma.bank.createMany({
      data: [
        { ...baseBankData, bankCode: '001', bankName: 'Banco A', agency: '0001', account: '11111-1', active: true },
        { ...baseBankData, bankCode: '033', bankName: 'Banco B', agency: '0002', account: '22222-2', active: false },
        { ...baseBankData, bankCode: '341', bankName: 'Banco C', agency: '0003', account: '33333-3', active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: true });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((b) => b.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    // Arrange
    await prisma.bank.createMany({
      data: [
        { ...baseBankData, bankCode: '001', bankName: 'Banco A', agency: '0001', account: '11111-1', active: true },
        { ...baseBankData, bankCode: '033', bankName: 'Banco B', agency: '0002', account: '22222-2', active: false },
        { ...baseBankData, bankCode: '341', bankName: 'Banco C', agency: '0003', account: '33333-3', active: false },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: false });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((b) => !b.active)).toBe(true);
  });

  it('should filter by search in drawer, bankName and bankCode', async() => {
    // Arrange
    await prisma.bank.createMany({
      data: [
        { ...baseBankData, drawer: 'Empresa ABC', bankName: 'Banco do Brasil' },
        { ...baseBankData, bankCode: '033', bankName: 'Santander', agency: '0002', account: '65432-1' },
        { ...baseBankData, bankCode: '341', bankName: 'Itaú', agency: '0003', account: '11111-1' },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Santander' });

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].bankName).toBe('Santander');
  });

  it('should return correct BankDto structure', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: baseBankData,
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<BankDto>({
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
      active: bank.active,
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
    });
  });
});
