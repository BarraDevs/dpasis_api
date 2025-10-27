import { AccountDto, AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import { IAccountDao } from 'src/app/account/application/persistence/dao/account-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
export declare class AccountPrismaAdapterDao implements IAccountDao {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByCredential(credential: string): Promise<AccountWithSensitiveDataDto | null>;
    findByEmail(email: string): Promise<AccountWithSensitiveDataDto | null>;
    findById(id: string): Promise<AccountDto | null>;
    forgotPassword(id: string, passwordResetToken: string): Promise<void>;
    resetPassword(id: string, password: string): Promise<void>;
}
