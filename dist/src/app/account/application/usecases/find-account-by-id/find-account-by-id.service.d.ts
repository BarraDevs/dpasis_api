import { AccountDto } from '../../dtos/account.dto';
import type { IAccountDao } from '../../persistence/dao/account-dao.interface';
export declare class FindAccountById {
    private readonly accountDao;
    constructor(accountDao: IAccountDao);
    execute(id: string): Promise<AccountDto | null>;
}
