import { AccountWithSensitiveDataDto } from '../../dtos/account.dto';
import type { IAccountDao } from '../../persistence/dao/account-dao.interface';
export declare class FindAccountByCredential {
    private readonly accountDao;
    constructor(accountDao: IAccountDao);
    execute(credential: string): Promise<AccountWithSensitiveDataDto | null>;
}
