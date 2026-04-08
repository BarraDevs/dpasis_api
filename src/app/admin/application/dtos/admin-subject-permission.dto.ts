import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PermissionLevel } from '../permission/permission-level.enum';

export class AdminSubjectPermissionInputDto {
  @ApiProperty({ enum: ClaimSubject, example: ClaimSubject.Bank })
  @IsEnum(ClaimSubject, { message: '$property deve ser um assunto válido' })
  subject: ClaimSubject;

  @ApiProperty({ example: true })
  @IsBoolean({ message: '$property deve ser um booleano' })
  enabled: boolean;

  @ApiPropertyOptional({ enum: PermissionLevel, example: PermissionLevel.Read })
  @ValidateIf((o: AdminSubjectPermissionInputDto) => o.enabled === true)
  @IsNotEmpty({ message: 'level é obrigatório quando enabled é true' })
  @IsEnum(PermissionLevel, { message: '$property deve ser read ou write' })
  level?: PermissionLevel;
}

export class AdminSubjectPermissionResponseDto {
  @ApiProperty({ enum: ClaimSubject })
  subject: ClaimSubject;

  @ApiProperty({ description: 'Rótulo para exibição na UI' })
  label: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty({
    enum: PermissionLevel,
    description: 'Quando enabled é false, retorna read como valor padrão da UI',
  })
  level: PermissionLevel;
}

export class PermissionSubjectCatalogItemDto {
  @ApiProperty({ enum: ClaimSubject })
  subject: ClaimSubject;

  @ApiProperty()
  label: string;
}
