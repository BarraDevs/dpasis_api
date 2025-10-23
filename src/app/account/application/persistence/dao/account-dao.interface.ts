import { AccountDto, AccountWithSensitiveDataDto } from '../../dtos/account.dto';

export interface IAccountDao {
  findByCredential(credential: string): Promise<AccountWithSensitiveDataDto | null>;
  findByEmail(email: string): Promise<AccountWithSensitiveDataDto | null>;
  findById(id: string): Promise<AccountDto | null>;
  forgotPassword(id: string, passwordResetToken: string): Promise<void>;
  resetPassword(id: string, password: string): Promise<void>;
}
