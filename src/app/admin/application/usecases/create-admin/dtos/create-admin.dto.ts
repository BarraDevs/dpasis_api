import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { AdminSubjectPermissionInputDto } from '../../../dtos/admin-subject-permission.dto';

export class CreateAdminInputDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  name: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail({}, { message: '$property deve ser um e-mail válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  email: string;

  @ApiProperty({ example: 'SenhaForte123' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  password: string;

  @ApiProperty({ example: '529.982.247-25' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  document: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.png' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  profilePicture: string | null;

  @ApiProperty({ type: [AdminSubjectPermissionInputDto], description: 'Permissões por assunto (nível read/write)' })
  @IsArray({ message: '$property deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => AdminSubjectPermissionInputDto)
  subjects: AdminSubjectPermissionInputDto[];
}

export class CreateAdminOutputDto {
  id: number;
}
