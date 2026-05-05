import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { VoucherCode } from 'src/app/voucher/domain/value-objects/voucher-code.vo';
import type { IVoucherDao, ResaleVoucherDto } from '../../persistence/dao/voucher-dao.interface';
import { GenerateManufacturerVouchersOutputDto } from './dtos/generate-manufacturer-vouchers.dto';

@Injectable()
export class GenerateManufacturerVouchers {
  constructor(
    @Inject(TOKENS.VoucherDao) private readonly voucherDao: IVoucherDao,
  ) {}

  public async execute(): Promise<GenerateManufacturerVouchersOutputDto> {
    const year = new Date().getFullYear();
    const resales = await this.voucherDao.findIndicatorResales();

    const updates: ResaleVoucherDto[] = [];
    let skipped = 0;

    for (const resale of resales) {
      const vo = VoucherCode.fromResaleCode(resale.identifier ?? '', year);
      if (!vo.value) {
        skipped++;
        continue;
      }
      updates.push({ id: resale.id, voucher: vo.value });
    }

    const generated = updates.length;
    if (generated > 0) {
      await this.voucherDao.updateVouchers(updates);
    }

    return {
      generated,
      skipped,
      year,
      message: `${generated} voucher${generated !== 1 ? 's' : ''} gerado${generated !== 1 ? 's' : ''} com sucesso.`,
    };
  }
}
