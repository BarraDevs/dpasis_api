import { AccountRole } from '../../domain/enums/account-role.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';

export class AccountDto {
  id: string;
  email: string;
  status: AccountStatus;
  roles: AccountRole[];
}

export class AccountWithSensitiveDataDto extends AccountDto {
  password: string;
  passwordResetToken: string | null;
}
