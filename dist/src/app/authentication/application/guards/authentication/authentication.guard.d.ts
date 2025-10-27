import { CanActivate, ExecutionContext } from '@nestjs/common';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
export declare class AuthenticationGuard implements CanActivate {
    private readonly cacheGateway;
    private readonly findAccountByIdService;
    constructor(cacheGateway: ICacheGateway, findAccountByIdService: FindAccountById);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getAccount;
}
