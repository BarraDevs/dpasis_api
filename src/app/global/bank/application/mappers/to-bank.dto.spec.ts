import { bankChargesFromDto, toBankDto, type BankRow } from './to-bank.dto';

function makeBankRow(overrides: Partial<BankRow> = {}): BankRow {
  return {
    id: 1,
    drawer: 'Empresa XYZ Ltda',
    wallet: '123',
    account: '12345-6',
    agency: '0001',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    paymentLocation: null,
    fineRate: null,
    moraRate: null,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('toBankDto - Unit tests', () => {
  it('should be defined', () => {
    expect(toBankDto).toBeDefined();
  });

  it('should map numeric rates', () => {
    // Arrange
    const row = makeBankRow({
      fineRate: 2,
      moraRate: 1,
    });

    // Act
    const result = toBankDto(row);

    // Assert
    expect(result.fineRate).toBe(2);
    expect(result.moraRate).toBe(1);
  });

  it.each([null, undefined])('should map missing rates %s to null', (value: null | undefined) => {
    // Arrange
    const row = makeBankRow({ fineRate: value, moraRate: value });

    // Act
    const result = toBankDto(row);

    // Assert
    expect(result.fineRate).toBeNull();
    expect(result.moraRate).toBeNull();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('should map non-finite rates %s to null', (value: number) => {
    // Arrange
    const row = makeBankRow({ fineRate: value, moraRate: value });

    // Act
    const result = toBankDto(row);

    // Assert
    expect(result.fineRate).toBeNull();
    expect(result.moraRate).toBeNull();
  });

  it('should coerce Prisma Decimal-like values to numbers', () => {
    // Arrange
    const row = makeBankRow({
      fineRate: { toString: () => '2.50' },
      moraRate: { toString: () => '1.00' },
    });

    // Act
    const result = toBankDto(row);

    // Assert
    expect(result.fineRate).toBe(2.5);
    expect(result.moraRate).toBe(1);
  });
});

describe('bankChargesFromDto - Unit tests', () => {
  it('should be defined', () => {
    expect(bankChargesFromDto).toBeDefined();
  });

  it.each([undefined, null])('should return null charges when bank is %s', (bank: undefined | null) => {
    // Arrange / Act
    const result = bankChargesFromDto(bank);

    // Assert
    expect(result).toEqual({
      fineRate: null,
      moraRate: null,
    });
  });

  it('should ignore function leaks from golevelup mocks', () => {
    // Arrange
    const bank = {
      fineRate: (() => 2) as unknown as number,
      moraRate: (() => 1) as unknown as number,
    };

    // Act
    const result = bankChargesFromDto(bank);

    // Assert
    expect(result).toEqual({
      fineRate: null,
      moraRate: null,
    });
  });

  it('should keep fineRate 0', () => {
    // Arrange
    const bank = { fineRate: 0, moraRate: null };

    // Act
    const result = bankChargesFromDto(bank);

    // Assert
    expect(result.fineRate).toBe(0);
    expect(typeof result.fineRate).toBe('number');
  });
});
