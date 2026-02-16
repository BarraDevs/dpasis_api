import { Test } from '@nestjs/testing';
import { AccountDto, AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountDaoAdapterPrisma } from './account-prisma.dao';

describe('AccountDaoAdapterPrisma - Integration tests', () => {
  let sut: AccountDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AccountDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(AccountDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findByCredential', () => {
    it('should return null when account does not exist', async() => {
      const credential = 'non-existing@email.com';

      const result = await sut.findByCredential(credential);

      expect(result).toBeNull();
    });

    it('should return account with sensitive data when found by email', async() => {
      const created = await prisma.account.create({
        data: {
          name: 'Jhon Doe',
          email: 'jhondoe@email.com',
          password: 'hashedpassword',
          status: AccountStatus.ACTIVE,
          role: AccountRole.ADMIN,
        },
      });

      const result = await sut.findByCredential('jhondoe@email.com');

      expect(result).not.toBeNull();
      expect(result).toEqual<AccountWithSensitiveDataDto>({
        id: created.id,
        name: 'Jhon Doe',
        email: 'jhondoe@email.com',
        password: 'hashedpassword',
        passwordResetToken: null,
        role: AccountRole.ADMIN,
        status: AccountStatus.ACTIVE,
      });
    });
  });

  describe('findByEmail', () => {
    it('should return null when account does not exist', async() => {
      const email = 'non-existing@email.com';

      const result = await sut.findByEmail(email);

      expect(result).toBeNull();
    });

    it('should return account with sensitive data when found by email', async() => {
      const created = await prisma.account.create({
        data: {
          name: 'Jhon Doe',
          email: 'jhondoe@email.com',
          password: 'hashedpassword',
          status: AccountStatus.ACTIVE,
          role: AccountRole.ADMIN,
        },
      });

      const result = await sut.findByEmail('jhondoe@email.com');

      expect(result).not.toBeNull();
      expect(result).toEqual<AccountWithSensitiveDataDto>({
        id: created.id,
        name: 'Jhon Doe',
        email: 'jhondoe@email.com',
        password: 'hashedpassword',
        passwordResetToken: null,
        role: AccountRole.ADMIN,
        status: AccountStatus.ACTIVE,
      });
    });
  });

  describe('findById', () => {
    it('should return null when account does not exist', async() => {
      const id = 'non-existing-id';

      const result = await sut.findById(id);

      expect(result).toBeNull();
    });

    it('should return account without sensitive data when found by id', async() => {
      const created = await prisma.account.create({
        data: {
          name: 'Jhon Doe',
          email: 'jhondoe@email.com',
          password: 'hashedpassword',
          status: AccountStatus.ACTIVE,
          role: AccountRole.ADMIN,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<AccountDto>({
        id: created.id,
        name: 'Jhon Doe',
        email: 'jhondoe@email.com',
        role: AccountRole.ADMIN,
        status: AccountStatus.ACTIVE,
      });
    });
  });

  describe('forgotPassword', () => {
    it('should update passwordResetToken', async() => {
      const account = await prisma.account.create({
        data: {
          name: 'Jhon Doe',
          email: 'jhondoe@email.com',
          password: 'oldpassword',
          status: AccountStatus.ACTIVE,
          role: AccountRole.ADMIN,
        },
      });

      const newToken = 'new-reset-token-123';

      await sut.forgotPassword(account.id, newToken);

      const updated = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(updated?.passwordResetToken).toBe(newToken);
      expect(updated?.password).toBe('oldpassword');
    });
  });

  describe('resetPassword', () => {
    it('should update password and clear passwordResetToken', async() => {
      const account = await prisma.account.create({
        data: {
          name: 'Jhon Doe',
          email: 'jhondoe@email.com',
          password: 'oldpassword',
          passwordResetToken: 'reset-token-xyz',
          status: AccountStatus.ACTIVE,
          role: AccountRole.ADMIN,
        },
      });

      const newPassword = 'newSecurePassword123';

      await sut.resetPassword(account.id, newPassword);

      const updated = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(updated?.password).toBe(newPassword);
      expect(updated?.passwordResetToken).toBeNull();
    });
  });
});
