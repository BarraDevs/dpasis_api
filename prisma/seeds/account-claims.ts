import { PrismaClient } from '@prisma/client';
import { AccountRole } from '../../src/app/account/domain/enums/account-role.enum';
import { ALL_CLAIM_VALUES } from '../../src/app/authentication/domain/authorization/claim';

export class AccountClaimSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const adminAccounts = await prisma.account.findMany({
      where: { role: AccountRole.ADMIN },
      select: { id: true },
    });

    for (const { id } of adminAccounts) {
      for (const claim of ALL_CLAIM_VALUES) {
        await prisma.accountClaim.upsert({
          where: {
            // eslint-disable-next-line camelcase
            accountId_claim: {
              accountId: id,
              claim,
            },
          },
          create: {
            accountId: id,
            claim,
          },
          update: {},
        });
      }
    }

    console.log('Account claims seeded');
  }
}
