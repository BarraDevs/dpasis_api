import { Injectable } from '@nestjs/common';
import { VoucherCode } from 'src/app/voucher/domain/value-objects/voucher-code.vo';
import { GenerateVoucherInputDto, GenerateVoucherOutputDto } from './dtos/generate-voucher.dto';

@Injectable()
export class GenerateVoucher {
  public async execute(input: GenerateVoucherInputDto): Promise<GenerateVoucherOutputDto> {
    const year = new Date().getFullYear();
    const vo = VoucherCode.fromResaleCode(String(input.id), year);

    return {
      voucher: vo.value,
      year,
    };
  }
}
