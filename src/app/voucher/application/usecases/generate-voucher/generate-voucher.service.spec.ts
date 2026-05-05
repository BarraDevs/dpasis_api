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
});
