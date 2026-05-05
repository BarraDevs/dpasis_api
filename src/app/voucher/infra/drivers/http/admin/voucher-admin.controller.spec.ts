import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { GenerateManufacturerVouchers } from 'src/app/voucher/application/usecases/generate-manufacturer-vouchers/generate-manufacturer-vouchers.service';
import { GenerateManufacturerVouchersOutputDto } from 'src/app/voucher/application/usecases/generate-manufacturer-vouchers/dtos/generate-manufacturer-vouchers.dto';
import { VoucherAdminController } from './voucher-admin.controller';

describe('VoucherAdminController - Unit tests', () => {
  let sut: VoucherAdminController;
  let generateManufacturerVouchers: GenerateManufacturerVouchers;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [VoucherAdminController],
      providers: [
        {
          provide: GenerateManufacturerVouchers,
          useValue: createMock<GenerateManufacturerVouchers>(),
        },
      ],
    }).compile();

    sut = module.get(VoucherAdminController);
    generateManufacturerVouchers = module.get(GenerateManufacturerVouchers);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('generate', () => {
    it('should call generateManufacturerVouchers.execute and return its result', async() => {
      // Arrange
      const output: GenerateManufacturerVouchersOutputDto = {
        generated: 2,
        skipped: 1,
        year: 2026,
        message: '2 vouchers gerados com sucesso.',
      };
      const executeSpy = jest
        .spyOn(generateManufacturerVouchers, 'execute')
        .mockResolvedValue(output);

      // Act
      const result = await sut.generate();

      // Assert
      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith();
    });
  });
});
