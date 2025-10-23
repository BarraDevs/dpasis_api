import { SetMetadata } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';

export const ROLE_KEY = 'ROLE';
export const SetRoles = (...roles: AccountRole[]) => SetMetadata(ROLE_KEY, roles);
