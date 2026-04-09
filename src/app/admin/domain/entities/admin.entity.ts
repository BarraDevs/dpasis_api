import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import type { ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { AdminCannotBeInactiveError } from '../errors/admin-cannot-be-inactive';

export type AdminProps = AdminCreateProps & {
  accountId: number;
  status: AccountStatus;
  canBeRemoved: boolean;
};

export type AdminCreateProps = {
  document: string;
  name: string;
  email: string;
  profilePicture: string | null;
  claims: ClaimValue[];
};

export class Admin {
  private readonly _props: AdminProps;

  static _instantiate(props: AdminProps): Admin {
    return new Admin(props);
  }

  private constructor(props: AdminProps) {
    this._props = props;
  }

  public get props(): Readonly<AdminProps> {
    return { ...this._props };
  }

  public isActive(): boolean {
    return this._props.status === AccountStatus.ACTIVE;
  }

  public activate(): void {
    this._props.status = AccountStatus.ACTIVE;
  }

  public deactivate(): void {
    if (!this._props.canBeRemoved) {
      throw new AdminCannotBeInactiveError();
    }
    this._props.status = AccountStatus.INACTIVE;
  }
}
