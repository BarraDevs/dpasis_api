import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';

export type Payload = {
  sub: string;
  roles: AccountRole[];
}
