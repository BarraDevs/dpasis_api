import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientContactInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @Trim()
  clientId: number;

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
  phone?: string | null;

  @ApiPropertyOptional({ example: '11988887777' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(20, { message: '$property deve ter no máximo 20 caracteres' })
  @Trim()
  whatsapp?: string | null;

  @ApiPropertyOptional({ example: 'Observações sobre o contato' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  observations?: string | null;

  @ApiProperty({ example: false })
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  receiveNF: boolean;
}

export class CreateClientContactOutputDto {
  id: number;
}
