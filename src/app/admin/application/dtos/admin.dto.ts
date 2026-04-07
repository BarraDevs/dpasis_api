import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import type { ClaimValue } from 'src/app/authentication/domain/authorization/claim';

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
  permissions: ClaimValue[];
}
