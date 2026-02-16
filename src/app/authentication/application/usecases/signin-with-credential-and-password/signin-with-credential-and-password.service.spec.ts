import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { Password } from 'src/shared/value-objects/password/password.vo';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidCredentialError } from '../../errors/invalid-credential.error';
import { SigninWithCredentialAndPasswordInputDto } from './dtos/signin-with-credential-and-password.dto';
import { SignInWithCredentialAndPassword } from './signin-with-credential-and-password.service';

describe('SigninWithCredentialAndPassword', () => {
  let sut: SignInWithCredentialAndPassword;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AuthenticationModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(SignInWithCredentialAndPassword);
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

  it('should throw an error if account is not found', async() => {
    // Arrange
    const data: SigninWithCredentialAndPasswordInputDto = {
      credential: 'credential',
      password: 'password',
    };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
    });
  });

  it('should throw an error if password is invalid', async() => {
    // Arrange
    const role = AccountRole.SELLER;
    const email = 'jhondoe@email.com';
    const password = '123456';
    const hashedPassword = new Password(password).value;

    await prisma.account.create({
      data: {
        roles: { create: { role } },
        email,
        password: hashedPassword,
        status: AccountStatus.ACTIVE,
      },
    });

    const data: SigninWithCredentialAndPasswordInputDto = {
      credential: email,
      password: 'another-password',
    };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
    });
  });

  it('should throw an error if account status is inactive', async() => {
    // Arrange
    const role = AccountRole.SELLER;
    const email = 'jhondoe@email.com';
    const password = '123456';
    const hashedPassword = new Password(password).value;

    await prisma.account.create({
      data: {
        roles: { create: { role } },
        email,
        password: hashedPassword,
        status: AccountStatus.INACTIVE,
      },
    });

    const data: SigninWithCredentialAndPasswordInputDto = {
      credential: email,
      password,
    };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InactiveAccountError);
    });
  });

  it('should throw an error if account status is not active', async() => {
    // Arrange
    const role = AccountRole.SELLER;
    const email = 'jhondoe@email.com';
    const password = '123456';
    const hashedPassword = new Password(password).value;

    await prisma.account.create({
      data: {
        roles: { create: { role } },
        email,
        password: hashedPassword,
        status: AccountStatus.PENDING,
      },
    });

    const data: SigninWithCredentialAndPasswordInputDto = {
      credential: email,
      password,
    };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(ForbiddenAccountError);
    });
  });

  it('should return an access token if credentials are valid', async() => {
    // Arrange
    const role = AccountRole.SELLER;
    const email = 'jhondoe@email.com';
    const password = '123456';
    const hashedPassword = new Password(password).value;

    await prisma.account.create({
      data: {
        roles: { create: { role } },
        email,
        password: hashedPassword,
        status: AccountStatus.ACTIVE,
      },
    });

    const data: SigninWithCredentialAndPasswordInputDto = {
      credential: email,
      password,
    };

    // Act
    const result = await sut.execute(data);

    // Assert
    expect(result.accessToken).not.toBeNull();
  });
});
