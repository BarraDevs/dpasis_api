import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsUnsigned32HexString } from 'src/infra/validators/class/decorators/unsigned-32-hex-string/is-unsigned-32-hex-string';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateResaleContactInputDto {
  @ApiProperty({ example: '1', description: 'ID da revenda em hexadecimal (1 a 8 caracteres).' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  @IsUnsigned32HexString()
  resaleId: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  departmentId: number;

  @ApiProperty({ example: 'João Silva' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  name: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail({}, { message: '$property deve ser um email válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  email: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(20, { message: '$property deve ter no máximo 20 caracteres' })
  @Trim()
  phone: string | null;

  @ApiPropertyOptional({ example: '11988887777' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(20, { message: '$property deve ter no máximo 20 caracteres' })
  @Trim()
  whatsapp: string | null;

  @ApiPropertyOptional({ example: 'Observações sobre o contato' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  observations: string | null;

  @ApiProperty({ example: false })
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  receiveNF: boolean;
}

export type CreateResaleContactExecuteInput = Omit<CreateResaleContactInputDto, 'resaleId'> & {
  resaleId: number;
};

export class CreateResaleContactOutputDto {
  id: number;
}
