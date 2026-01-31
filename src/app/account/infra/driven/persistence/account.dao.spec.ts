import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountPrismaAdapterDao } from './account.dao';

describe('AccountPrismaAdapterDao', () => {
  let sut: AccountPrismaAdapterDao;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AccountPrismaAdapterDao, PrismaService],
    }).compile();

    sut = module.get(AccountPrismaAdapterDao);
    prisma = module.get(PrismaService);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('Account DAO methods', () => {
    beforeEach(async() => {
      await prisma.account.create({
        data: {
          id: 'account-dao-01',
          email: 'test@example.com',
          password: 'hashedpassword',
          status: AccountStatus.ACTIVE,
          roles: { create: [{ role: AccountRole.ADMIN }] },
        },
        include: { roles: true },
      });
    });

    it('findByCredential should return account with sensitive data', async() => {
      const result = await sut.findByCredential('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.password).toBe('hashedpassword');
      expect(result?.roles).toContain(AccountRole.ADMIN);
    });

    it('findByEmail should return account with sensitive data', async() => {
      const result = await sut.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.password).toBe('hashedpassword');
      expect(result?.roles).toContain(AccountRole.ADMIN);
    });

    it('findById should return account without sensitive data', async() => {
      const result = await sut.findById('account-dao-01');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.roles).toContain(AccountRole.ADMIN);
      expect(result).not.toHaveProperty('password');
    });

    it('forgotPassword should update passwordResetToken', async() => {
      await sut.forgotPassword('account-dao-01', 'reset-token');

      const updated = await prisma.account.findUnique({ where: { id: 'account-dao-01' } });
      expect(updated?.passwordResetToken).toBe('reset-token');
    });

    it('resetPassword should update password and clear passwordResetToken', async() => {
      await prisma.account.update({ where: { id: 'account-dao-01' }, data: { passwordResetToken: 'reset-token' } });
      await sut.resetPassword('account-dao-01', 'new-password');

      const updated = await prisma.account.findUnique({ where: { id: 'account-dao-01' } });
      expect(updated?.password).toBe('new-password');
      expect(updated?.passwordResetToken).toBeNull();
    });
  });
});
