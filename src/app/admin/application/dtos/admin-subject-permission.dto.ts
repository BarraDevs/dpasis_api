import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { PermissionLevel } from '../../domain/enums/permission-level.enum';

export class AdminSubjectPermissionInputDto {
  @ApiProperty({ enum: ClaimSubject, example: ClaimSubject.Bank })
  @IsEnum(ClaimSubject, { message: '$property deve ser um assunto válido' })
  subject: ClaimSubject;

  @ApiProperty({ example: true })
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ enum: PermissionLevel, example: PermissionLevel.Read })
  @ValidateIf((o: AdminSubjectPermissionInputDto) => o.enabled === true)
  @IsNotEmpty({ message: 'level é obrigatório quando enabled é true' })
  @IsEnum(PermissionLevel, { message: '$property deve ser read ou write' })
  level?: PermissionLevel;
}

export class AdminSubjectPermissionOutputDto {
  @ApiProperty({ description: 'Rótulo para exibição na UI' })
  label: string;

  @ApiProperty({ enum: ClaimSubject })
  subject: ClaimSubject;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty({ enum: PermissionLevel, description: 'Quando enabled é false, retorna read como valor padrão da UI' })
  level: PermissionLevel;
}
