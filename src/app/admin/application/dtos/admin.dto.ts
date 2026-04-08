import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import type { ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { AdminSubjectPermissionResponseDto } from './admin-subject-permission.dto';

export class AdminListDto {
  id: number;
  name: string;
  email: string;
  status: AccountStatus;
  profilePicture: string | null;
  document: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminDetailDto extends AdminListDto {
  @ApiPropertyOptional({
    description: 'Claims persistidas (read/write por assunto). Preferir `subjects` na integração.',
    deprecated: true,
  })
  claims: ClaimValue[];

  @ApiProperty({ type: [AdminSubjectPermissionResponseDto], description: 'Permissões por assunto para a UI' })
  subjects: AdminSubjectPermissionResponseDto[];
}

/** Retorno do DAO antes de enriquecer com `subjects` (montado no use case). */
export type AdminDetailFromDao = Omit<AdminDetailDto, 'subjects'>;
