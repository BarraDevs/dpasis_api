import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CancelBankPaymentInputDto {
  @ApiProperty({ enum: BankPaymentProvider, example: BankPaymentProvider.INTER })
  @IsEnum(BankPaymentProvider, { message: '$property deve ser um provedor válido' })
  provider: BankPaymentProvider;

  @ApiProperty({ example: 'Cliente pediu o cancelamento', maxLength: 50 })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  reason: string;
}
