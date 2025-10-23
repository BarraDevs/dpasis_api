import { AccountRole } from '../enums/account-role.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { InvalidAccountRolesError, InvalidAccountStatusError } from './account.error';

export class Account {
  private _status: AccountStatus;
  private _roles: AccountRole[];

  constructor(status: string, roles: string[]) {
    this.status = status;
    this.roles = roles;
  }

  private set status(status: string) {
    if (!Object.values(AccountStatus).includes(status as AccountStatus)) {
      throw new InvalidAccountStatusError(status);
    }
    this._status = status as AccountStatus;
  }

  private set roles(roles: string[]) {
    const invalidRoles = roles.filter((role) => !Object.values(AccountRole).includes(role as AccountRole));
    if (invalidRoles.length > 0) {
      throw new InvalidAccountRolesError(invalidRoles);
    }
    this._roles = roles as AccountRole[];
  }

  get isActive(): boolean {
    return this._status === AccountStatus.ACTIVE;
  }
  get isInactive(): boolean {
    return this._status === AccountStatus.INACTIVE;
  }
  // Add more status checks as needed

  get isAdmin(): boolean {
    return this._roles.includes(AccountRole.ADMIN);
  }
  // Add more role checks as needed
}
