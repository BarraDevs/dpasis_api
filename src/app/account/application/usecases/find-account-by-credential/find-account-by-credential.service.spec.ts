import { Test } from '@nestjs/testing';
import { AccountModule } from 'src/app/account/account.module';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountWithSensitiveDataDto } from '../../dtos/account.dto';
import { FindAccountByCredential } from './find-account-by-credential.service';

describe('FindAccountByCredential', () => {
  let sut: FindAccountByCredential;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAccountByCredential);
    prisma = module.get(PrismaService);

    await prisma.account.deleteMany();
  });

  afterEach(async() => {
    await prisma.account.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call accountDao.findByCredential with correct values', async() => {
      // Arrange
      const credential = 'any-credential';
      const findByCredentialSpy = jest.spyOn(sut['accountDao'], 'findByCredential');

      // Act
      await sut.execute(credential);

      // Assert
      expect(findByCredentialSpy).toHaveBeenCalledWith(credential);
    });
  });

  describe('integration tests', () => {
    it('should return null if account is not found', async() => {
    // Arrange
      const credential = 'non-existing-credential';

      // Act
      const result = await sut.execute(credential);

      // Assert
      expect(result).toBeNull();
    });

    it('should return account if found by credential', async() => {
    // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'jhondoe@email.com',
          password: 'securepassword',
          status: AccountStatus.ACTIVE,
          roles: {
            create: [
              { role: AccountRole.ADMIN },
              { role: AccountRole.SELLER },
            ],
          },
        },
      });

      // Act
      const result = await sut.execute(account.email);

      // Assert
      expect(result).toEqual<AccountWithSensitiveDataDto>({
        id: account.id,
        email: account.email,
        password: account.password,
        passwordResetToken: null,
        roles: [AccountRole.ADMIN, AccountRole.SELLER],
        status: AccountStatus.ACTIVE,
      });
    });
  });
});
