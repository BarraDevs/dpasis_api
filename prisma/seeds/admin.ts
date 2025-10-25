import { Prisma, PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AccountRole } from '../../src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from '../../src/app/account/domain/enums/account-status.enum';
import { Password } from '../../src/shared/value-objects/password/password.vo';

export class AdminSeed {
  private static data: Prisma.AdminCreateInput[] = [
    {
      accountId: crypto.randomUUID(),
      name: 'Admin Master',
      document: '12345678909',
      role: {
        create: {
          role: AccountRole.ADMIN,
          account: {
            create: {
              email: 'admin@email.com',
              password: new Password('123456').value,
              status: AccountStatus.ACTIVE,
            },
          },
        },
      },
    },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    for (const data of this.data) {
      await prisma.admin.create({
        data,
      });
    }

    console.log('Admins seeded');
  }
}
