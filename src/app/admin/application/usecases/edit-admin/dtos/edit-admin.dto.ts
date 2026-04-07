import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { ClaimInputDto } from '../../create-admin/dtos/create-admin.dto';

export class EditAdminInputDto {
  @ApiPropertyOptional({ example: 'Maria Silva' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  name?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @Trim()
  email?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.png' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  profilePicture?: string | null;

  @ApiPropertyOptional({ example: '529.982.247-25' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  document?: string;

  @ApiProperty({ type: [ClaimInputDto] })
  @IsArray({ message: '$property deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ClaimInputDto)
  claims: ClaimInputDto[];
}
