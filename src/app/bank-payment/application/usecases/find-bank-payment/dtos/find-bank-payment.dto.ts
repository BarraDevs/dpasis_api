import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';

export class FindBankPaymentQueryDto {
  @ApiProperty({ enum: BankPaymentProvider, example: BankPaymentProvider.INTER })
  @IsEnum(BankPaymentProvider, { message: '$property deve ser um provedor válido' })
  provider: BankPaymentProvider;

  @ApiProperty({ example: 1, description: 'Banco cujas credenciais Inter serão usadas' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser positivo' })
  bankId: number;
}

export class BankPaymentRequestCodeParams {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(100, { message: '$property deve ter no máximo 100 caracteres' })
  @Trim()
  codigoSolicitacao: string;
}
