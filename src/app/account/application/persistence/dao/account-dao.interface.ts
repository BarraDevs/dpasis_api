import { AccountDto, AccountWithSensitiveDataDto } from '../../dtos/account.dto';

export interface IAccountDao {
  findByCredential(credential: string): Promise<AccountWithSensitiveDataDto | null>;
  findByEmail(email: string): Promise<AccountWithSensitiveDataDto | null>;
  findById(id: number): Promise<AccountDto | null>;
  findClaimStringsByAccountId(accountId: number): Promise<string[]>;
  forgotPassword(id: number, passwordResetToken: string): Promise<void>;
  resetPassword(id: number, password: string): Promise<void>;
}
