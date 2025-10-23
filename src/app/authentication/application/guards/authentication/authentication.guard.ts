import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { AccountDto } from 'src/app/account/application/dtos/account.dto';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';
import { Account } from 'src/app/account/domain/value-objects/account.vo';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { CacheKeyBuilder } from 'src/infra/cache/helpers/cache-key/cache-key.builder';
import { InactiveAccountError } from '../../errors/inactive-account.error';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
    private readonly findAccountByIdService: FindAccountById,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getType() === 'ws'
      ? context.switchToWs().getClient()
      : context.switchToHttp().getRequest();

    if (!request?.user?.sub) {
      return false;
    }

    const accountData = await this.getAccount((request.user as Payload).sub);
    if (!accountData) {
      return false;
    }

    const account = new Account(accountData.status, accountData.roles);
    if (account.isInactive) {
      throw new InactiveAccountError();
    }

    return true;
  }

  private async getAccount(accountId: string): Promise<AccountDto | null> {
    const key = new CacheKeyBuilder()
      .setResource('account')
      .setCommand('detail', accountId)
      .build();

    const cachedAccount = await this.cacheGateway.get<AccountDto>(key);
    if (cachedAccount) {
      return cachedAccount;
    }

    const account = await this.findAccountByIdService.execute(accountId);
    if (account) {
      await this.cacheGateway.set(key, account, 30, true);
    }

    return account;
  }
}
