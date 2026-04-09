import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { AdminSubjectPermissionOutputDto } from './admin-subject-permission.dto';

export class AdminDto {
  id: number;
  name: string;
  email: string;
  status: AccountStatus;
  profilePicture: string | null;
  document: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminWithClaimsDto extends AdminDto {
  claims: ClaimValue[];
}

export class AdminWithSubjectsDto extends AdminDto {
  subjects: AdminSubjectPermissionOutputDto[];
}
