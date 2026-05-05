import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { GenerateVoucherInputDto } from 'src/app/voucher/application/usecases/generate-voucher/dtos/generate-voucher.dto';
import { GenerateVoucher } from 'src/app/voucher/application/usecases/generate-voucher/generate-voucher.service';
import { VoucherAdminController } from './voucher-admin.controller';

describe('VoucherAdminController - Unit tests', () => {
  let sut: VoucherAdminController;
  let generateVoucher: GenerateVoucher;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [VoucherAdminController],
      providers: [
        {
          provide: GenerateVoucher,
          useValue: createMock<GenerateVoucher>(),
        },
      ],
    }).compile();

    sut = module.get(VoucherAdminController);
    generateVoucher = module.get(GenerateVoucher);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('generateById', () => {
    it('should call generateVoucher.execute with body and return its result', async() => {
      // Arrange
      const body: GenerateVoucherInputDto = { id: 42 };
      const output = { voucher: 'ABC123', year: 2026 };
      const executeSpy = jest.spyOn(generateVoucher, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.generateById(body);

      // Assert
      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(body);
    });
  });
});
