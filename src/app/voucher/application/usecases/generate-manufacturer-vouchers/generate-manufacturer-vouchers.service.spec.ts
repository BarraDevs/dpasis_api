import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IVoucherDao } from '../../persistence/dao/voucher-dao.interface';
import { GenerateManufacturerVouchers } from './generate-manufacturer-vouchers.service';
import { GenerateManufacturerVouchersOutputDto } from './dtos/generate-manufacturer-vouchers.dto';

describe('GenerateManufacturerVouchers - Unit tests', () => {
  let sut: GenerateManufacturerVouchers;
  let voucherDao: IVoucherDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        GenerateManufacturerVouchers,
        {
          provide: TOKENS.VoucherDao,
          useValue: createMock<IVoucherDao>(),
        },
      ],
    }).compile();

    sut = module.get(GenerateManufacturerVouchers);
    voucherDao = module.get(TOKENS.VoucherDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return generated=0 and skipped=0 when no indicator resales exist', async() => {
    // Arrange
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([]);
    const updateSpy = jest.spyOn(voucherDao, 'updateVouchers').mockResolvedValue();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should call updateVouchers with correct batch for resales with identifier', async() => {
    // Arrange
    const year = new Date().getFullYear();
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([
      { id: 1, identifier: '000HU' },
      { id: 2, identifier: '000HV' },
    ]);
    const updateSpy = jest.spyOn(voucherDao, 'updateVouchers').mockResolvedValue();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.year).toBe(year);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    const [batch] = updateSpy.mock.calls[0];
    expect(batch).toHaveLength(2);
    expect(batch[0].id).toBe(1);
    expect(typeof batch[0].voucher).toBe('string');
    expect(batch[0].voucher.length).toBeGreaterThan(0);
    expect(batch[1].id).toBe(2);
  });

  it('should skip resales with null identifier', async() => {
    // Arrange
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([
      { id: 1, identifier: null },
      { id: 2, identifier: '000HU' },
    ]);
    const updateSpy = jest.spyOn(voucherDao, 'updateVouchers').mockResolvedValue();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(1);
    expect(result.skipped).toBe(1);
    expect(updateSpy).toHaveBeenCalledWith([{ id: 2, voucher: expect.any(String) }]);
  });

  it('should skip resales with empty string identifier', async() => {
    // Arrange
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([
      { id: 1, identifier: '' },
      { id: 2, identifier: '000HU' },
    ]);
    jest.spyOn(voucherDao, 'updateVouchers').mockResolvedValue();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.generated).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('should not call updateVouchers when all resales are skipped', async() => {
    // Arrange
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([
      { id: 1, identifier: null },
      { id: 2, identifier: null },
    ]);
    const updateSpy = jest.spyOn(voucherDao, 'updateVouchers').mockResolvedValue();

    // Act
    await sut.execute();

    // Assert
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should return the current year in output', async() => {
    // Arrange
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.year).toBe(new Date().getFullYear());
  });

  it('should return correct output shape', async() => {
    // Arrange
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([
      { id: 1, identifier: '000HU' },
    ]);
    jest.spyOn(voucherDao, 'updateVouchers').mockResolvedValue();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual<GenerateManufacturerVouchersOutputDto>({
      generated: 1,
      skipped: 0,
      year: new Date().getFullYear(),
      message: expect.any(String),
    });
  });

  it('should produce correct voucher code using VoucherCode VO (parity check)', async() => {
    // Arrange — use known value from legacy VB.NET: "000HU" + year "2025" → "CAPUYMOMTZTQ"
    jest.spyOn(voucherDao, 'findIndicatorResales').mockResolvedValue([
      { id: 1, identifier: '000HU' },
    ]);
    const updateSpy = jest.spyOn(voucherDao, 'updateVouchers').mockResolvedValue();

    // Act — spy on Date to fix year to 2025
    jest.spyOn(global, 'Date').mockImplementation(() => ({ getFullYear: () => 2025 }) as unknown as Date);
    await sut.execute();
    jest.restoreAllMocks();

    // Assert
    const [batch] = updateSpy.mock.calls[0];
    expect(batch[0].voucher).toBe('CAPUYMOMTZTQ');
  });
});
