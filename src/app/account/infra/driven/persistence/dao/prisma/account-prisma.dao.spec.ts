import { Test } from '@nestjs/testing';
import { AccountDto, AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import { AccountPersistenceModule } from 'src/app/account/application/persistence/account-persistence.module';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountPrismaAdapterDao } from './account-prisma.dao';

describe('AccountPrismaDao', () => {
  let sut: AccountPrismaAdapterDao;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AccountPersistenceModule,
        ConfigModule,
      ],
      providers: [AccountPrismaAdapterDao],
    }).compile();

    sut = module.get<AccountPrismaAdapterDao>(AccountPrismaAdapterDao);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.account.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findByCredential', () => {
    it('should return null if account not found', async() => {
      // Act
      const result = await sut.findByCredential('email@email.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should return account if found', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'account@email.com',
          password: 'hashed_password',
          status: AccountStatus.ACTIVE,
          roles: {
            create: [
              { role: AccountRole.USER },
              { role: AccountRole.ADMIN },
            ],
          },
        },
      });

      // Act
      const result = await sut.findByCredential(account.email);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<AccountWithSensitiveDataDto>({
        id: account.id,
        email: account.email,
        password: account.password,
        passwordResetToken: null,
        roles: expect.arrayContaining([AccountRole.USER, AccountRole.ADMIN]),
        status: AccountStatus.ACTIVE,
      });
    });
  });

  describe('findByEmail', () => {
    it('should return null if account not found', async() => {
      // Act
      const result = await sut.findByEmail('email@email.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should return account if found', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'account@email.com',
          password: 'hashed_password',
          status: AccountStatus.ACTIVE,
          roles: {
            create: [
              { role: AccountRole.USER },
              { role: AccountRole.ADMIN },
            ],
          },
        },
      });

      // Act
      const result = await sut.findByEmail(account.email);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<AccountWithSensitiveDataDto>({
        id: account.id,
        email: account.email,
        password: account.password,
        passwordResetToken: null,
        roles: expect.arrayContaining([AccountRole.USER, AccountRole.ADMIN]),
        status: AccountStatus.ACTIVE,
      });
    });
  });

  describe('findById', () => {
    it('should return null if account not found', async() => {
      // Act
      const result = await sut.findById('non-existing-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return account if found', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'account@email.com',
          password: 'hashed_password',
          status: AccountStatus.ACTIVE,
          roles: {
            create: [
              { role: AccountRole.USER },
            ],
          },
        },
      });

      // Act
      const result = await sut.findById(account.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<AccountDto>({
        id: account.id,
        email: account.email,
        roles: [AccountRole.USER],
        status: AccountStatus.ACTIVE,
      });
    });
  });

  describe('forgotPassword', () => {
    it('should update passwordResetToken', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'account@email.com',
          password: 'hashed_password',
          status: AccountStatus.ACTIVE,
        },
      });

      // Act
      const passwordResetToken = 'reset-token';
      await sut.forgotPassword(account.id, passwordResetToken);

      // Assert
      const updatedAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(updatedAccount?.passwordResetToken).toBe(passwordResetToken);
    });
  });

  describe('resetPassword', () => {
    it('should update password and clear passwordResetToken', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'account@email.com',
          password: 'old_hashed_password',
          passwordResetToken: 'reset-token',
          status: AccountStatus.ACTIVE,
        },
      });

      // Act
      const newPassword = 'new_hashed_password';
      await sut.resetPassword(account.id, newPassword);

      // Assert
      const updatedAccount = await prisma.account.findUnique({
        where: { id: account.id },
      });
      expect(updatedAccount?.password).toBe(newPassword);
      expect(updatedAccount?.passwordResetToken).toBeNull();
    });
  });
});
