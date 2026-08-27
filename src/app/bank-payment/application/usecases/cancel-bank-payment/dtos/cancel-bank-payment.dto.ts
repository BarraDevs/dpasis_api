import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BankPaymentCancelReason } from 'src/infra/bank-payment/enums/bank-payment-cancel-reason.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';

export class CancelBankPaymentInputDto {
  @ApiProperty({ enum: BankPaymentProvider, example: BankPaymentProvider.INTER })
  @IsEnum(BankPaymentProvider, { message: '$property deve ser um provedor válido' })
  provider: BankPaymentProvider;

  @ApiProperty({
    enum: BankPaymentCancelReason,
    example: BankPaymentCancelReason.CUSTOMER_REQUEST,
  })
  @IsEnum(BankPaymentCancelReason, {
    message: '$property deve ser ADJUSTMENTS, CUSTOMER_REQUEST, PAID_DIRECTLY_TO_CUSTOMER ou REPLACEMENT',
  })
  reason: BankPaymentCancelReason;
}
