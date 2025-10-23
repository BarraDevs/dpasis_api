import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { AccountDto } from '../../dtos/account.dto';
import type { IAccountDao } from '../../persistence/dao/account-dao.interface';

@Injectable()
export class FindAccountById {
  constructor(
    @Inject(TOKENS.AccountDao) private readonly accountDao: IAccountDao,
  ) {}

  public async execute(id: string): Promise<AccountDto | null> {
    return this.accountDao.findById(id);
  }
}
