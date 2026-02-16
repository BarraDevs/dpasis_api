import { AccountRole } from '../enums/account-role.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { InvalidAccountRoleError, InvalidAccountStatusError } from './account.error';

export class Account {
  private _role: AccountRole;
  private _status: AccountStatus;

  constructor(role: string, status: string) {
    this.role = role;
    this.status = status;
  }

  private set role(role: string) {
    if (!Object.values(AccountRole).includes(role as AccountRole)) {
      throw new InvalidAccountRoleError(role);
    }
    this._role = role as AccountRole;
  }

  private set status(status: string) {
    if (!Object.values(AccountStatus).includes(status as AccountStatus)) {
      throw new InvalidAccountStatusError(status);
    }
    this._status = status as AccountStatus;
  }

  public get isActive(): boolean {
    return this._status === AccountStatus.ACTIVE;
  }
  public get isInactive(): boolean {
    return this._status === AccountStatus.INACTIVE;
  }
  // Add more status checks as needed

  public get isAdmin(): boolean {
    return this._role === AccountRole.ADMIN;
  }
  public get isSeller(): boolean {
    return this._role === AccountRole.SELLER;
  }
  // Add more role checks as needed
}
