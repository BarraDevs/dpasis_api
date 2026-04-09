import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateBankInputDto {
  @ApiProperty({ example: 'Empresa XYZ Ltda' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  drawer: string;

  @ApiProperty({ example: '123' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  wallet: string;

  @ApiProperty({ example: '12345-6' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  account: string;

  @ApiProperty({ example: '0001' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(50, { message: '$property deve ter no máximo 50 caracteres' })
  @Trim()
  agency: string;

  @ApiProperty({ example: '001' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(20, { message: '$property deve ter no máximo 20 caracteres' })
  @Trim()
  bankCode: string;

  @ApiProperty({ example: 'Banco do Brasil' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  bankName: string;

  @ApiPropertyOptional({ example: 'Local de pagamento' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  paymentLocation: string | null;
}

export class CreateBankOutputDto {
  @ApiProperty()
  id: number;
}
