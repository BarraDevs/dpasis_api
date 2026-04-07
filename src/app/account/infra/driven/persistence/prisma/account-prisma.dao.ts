import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccountDto, AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import { IAccountDao } from 'src/app/account/application/persistence/dao/account-dao.interface';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { claimFromSubjectAction, type ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const AccountSelect = {
  id: true,
  role: true,
  name: true,
  email: true,
  status: true,
} satisfies Prisma.AccountSelect;

const AccountWithSensitiveDataSelect = {
  ...AccountSelect,
  password: true,
  passwordResetToken: true,
} satisfies Prisma.AccountSelect;

@Injectable()
export class AccountDaoAdapterPrisma implements IAccountDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findByCredential(credential: string): Promise<AccountWithSensitiveDataDto | null> {
    // credential can be either email, document, phone... but, for now, we are using only email.
    const account = await this.prisma.account.findFirst({
      where: { email: { equals: credential, mode: 'insensitive' } },
      select: AccountWithSensitiveDataSelect,
    });
    if (!account) {
      return null;
    }

    return {
      ...account,
      status: account.status as AccountStatus,
      role: account.role as AccountRole,
    };
  }

  public async findByEmail(email: string): Promise<AccountWithSensitiveDataDto | null> {
    const account = await this.prisma.account.findUnique({
      where: { email },
      select: AccountWithSensitiveDataSelect,
    });
    if (!account) {
      return null;
    }

    return {
      ...account,
      status: account.status as AccountStatus,
      role: account.role as AccountRole,
    };
  }

  public async findById(id: number): Promise<AccountDto | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: AccountSelect,
    });
    if (!account) {
      return null;
    }

    return {
      ...account,
      status: account.status as AccountStatus,
      role: account.role as AccountRole,
    };
  }

  public async findClaimsByAccountId(accountId: number): Promise<ClaimValue[]> {
    const rows = await this.prisma.accountClaim.findMany({
      where: { accountId },
      select: { subject: true, action: true },
    });

    // TODO: possibilidade de remover essa transformação
    return rows
      .map(row => claimFromSubjectAction(row.subject, row.action))
      .filter((c): c is ClaimValue => c !== null);
  }

  public async forgotPassword(id: number, passwordResetToken: string): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: { passwordResetToken },
    });
  }

  public async resetPassword(id: number, password: string): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: {
        password,
        passwordResetToken: null,
      },
    });
  }
}
