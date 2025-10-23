import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { AccountWithSensitiveDataDto } from '../../dtos/account.dto';
import type { IAccountDao } from '../../persistence/dao/account-dao.interface';

@Injectable()
export class FindAccountByCredential {
  constructor(
    @Inject(TOKENS.AccountDao) private readonly accountDao: IAccountDao,
  ) {}

  public async execute(credential: string): Promise<AccountWithSensitiveDataDto | null> {
    return this.accountDao.findByCredential(credential);
  }
}
