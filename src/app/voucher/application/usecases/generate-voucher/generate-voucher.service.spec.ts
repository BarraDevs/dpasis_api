import { Test } from '@nestjs/testing';
import { VoucherCode } from 'src/app/voucher/domain/value-objects/voucher-code.vo';
import { GenerateVoucherInputDto } from './dtos/generate-voucher.dto';
import { GenerateVoucher } from './generate-voucher.service';

function makeGenerateVoucherInput(overrides: Partial<GenerateVoucherInputDto> = {}): GenerateVoucherInputDto {
  return {
    id: 1,
    ...overrides,
  };
}

describe('GenerateVoucher - Unit tests', () => {
  let sut: GenerateVoucher;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [GenerateVoucher],
    }).compile();

    sut = module.get(GenerateVoucher);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return voucher from VoucherCode using String(id) and local current year', async() => {
    // Arrange — data local no meio de 2025 evita ambiguidade de ano perto de 1º de janeiro em UTC
    jest.useFakeTimers({ now: new Date(2025, 5, 15) });
    const input = makeGenerateVoucherInput({ id: 42 });

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.year).toBe(2025);
    expect(result.voucher).toBe(VoucherCode.fromResaleCode('42', 2025).value);
    expect(result.voucher.length).toBeGreaterThan(0);
  });

  it('should use String(id) so numeric 1 differs from legacy padded identifier "00001"', async() => {
    // Arrange
    jest.useFakeTimers({ now: new Date(2025, 5, 15) });
    const input = makeGenerateVoucherInput({ id: 1 });

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.voucher).toBe(VoucherCode.fromResaleCode('1', result.year).value);
    expect(result.voucher).not.toBe(VoucherCode.fromResaleCode('00001', result.year).value);
  });

  it('should return the same voucher for the same id (deterministic)', async() => {
    // Arrange
    jest.useFakeTimers({ now: new Date(2025, 5, 15) });
    const input = makeGenerateVoucherInput({ id: 7 });

    // Act
    const first = await sut.execute(input);
    const second = await sut.execute(input);

    // Assert
    expect(first.voucher).toBe(second.voucher);
    expect(first.year).toBe(second.year);
  });

  it('should return different vouchers for different ids', async() => {
    // Arrange
    jest.useFakeTimers({ now: new Date(2025, 5, 15) });

    // Act
    const a = await sut.execute(makeGenerateVoucherInput({ id: 10 }));
    const b = await sut.execute(makeGenerateVoucherInput({ id: 11 }));

    // Assert
    expect(a.voucher).not.toBe(b.voucher);
  });

  it('should use current year from Date when clock is in 2026', async() => {
    // Arrange
    jest.useFakeTimers({ now: new Date(2026, 2, 10) });
    const input = makeGenerateVoucherInput({ id: 42 });

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.year).toBe(2026);
    expect(result.voucher).toBe(VoucherCode.fromResaleCode('42', 2026).value);
  });

  it('should return only voucher and year in output', async() => {
    // Arrange
    jest.useFakeTimers({ now: new Date(2025, 5, 15) });
    const input = makeGenerateVoucherInput({ id: 3 });

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(Object.keys(result).sort()).toEqual(['voucher', 'year']);
    expect(typeof result.voucher).toBe('string');
    expect(typeof result.year).toBe('number');
  });
});
