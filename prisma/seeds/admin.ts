import { Prisma, PrismaClient } from '@prisma/client';
import { AccountRole } from '../../src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from '../../src/app/account/domain/enums/account-status.enum';
import { Password } from '../../src/shared/value-objects/password/password.vo';

export class AdminSeed {
  private static data: Prisma.AdminCreateInput[] = [
    {
      document: '12345678909',
      account: {
        create: {
          name: 'Admin Master',
          role: AccountRole.ADMIN,
          status: AccountStatus.ACTIVE,
          email: 'admin@email.com',
          password: new Password('123456').value,
          canBeRemoved: false,
        },
      },
    },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const admin = await prisma.admin.findFirst();
    if (admin) {
      return;
    }

    for (const data of this.data) {
      await prisma.admin.create({
        data,
      });
    }

    console.log('Admins seeded');
  }
}
