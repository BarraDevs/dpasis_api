import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { AdminSubjectPermissionInputDto } from '../../../dtos/admin-subject-permission.dto';
import { CreateAdminInputDto } from '../../create-admin/dtos/create-admin.dto';

export class EditAdminInputDto extends PartialType(
  OmitType(CreateAdminInputDto, ['password', 'subjects'] as const),
  { skipNullProperties: false }
) {
  @ApiProperty({ type: [AdminSubjectPermissionInputDto], description: 'Permissões por assunto (nível read/write)' })
  @IsArray({ message: '$property deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => AdminSubjectPermissionInputDto)
  subjects: AdminSubjectPermissionInputDto[];
}
