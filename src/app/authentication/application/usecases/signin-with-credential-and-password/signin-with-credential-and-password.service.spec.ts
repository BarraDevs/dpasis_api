import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { ConfigModule } from 'src/core/config/config.module';
import { Password } from 'src/shared/value-objects/password/password.vo';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidCredentialError } from '../../errors/invalid-credential.error';
import { SigninWithCredentialAndPasswordInputDto } from './dtos/signin-with-credential-and-password.dto';
import { SignInWithCredentialAndPassword } from './signin-with-credential-and-password.service';

describe('SigninWithCredentialAndPassword - Unit tests', () => {
  let sut: SignInWithCredentialAndPassword;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AuthenticationModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(SignInWithCredentialAndPassword);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if account is not found', async() => {
    // Arrange
    const input = createMock<SigninWithCredentialAndPasswordInputDto>();
    jest.spyOn(sut['findAccountByCredential'], 'execute').mockResolvedValue(null);

    // Act & Assert
    expect.assertions(1);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
    });
  });

  it('should throw an error if password is invalid', async() => {
    // Arrange
    const input = createMock<SigninWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>();
    jest.spyOn(sut['findAccountByCredential'], 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(false);

    // Act & Assert
    expect.assertions(1);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
    });
  });

  it('should throw an error if account status is inactive', async() => {
    // Arrange
    const input = createMock<SigninWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>({ role: AccountRole.SELLER, status: AccountStatus.INACTIVE });
    jest.spyOn(sut['findAccountByCredential'], 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);

    // Act & Assert
    expect.assertions(1);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(InactiveAccountError);
    });
  });

  it('should throw an error if account status is not active', async() => {
    // Arrange
    const input = createMock<SigninWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>({ role: AccountRole.SELLER, status: AccountStatus.PENDING });
    jest.spyOn(sut['findAccountByCredential'], 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);

    // Act & Assert
    expect.assertions(1);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(ForbiddenAccountError);
    });
  });

  it('should return an access token if credentials are valid', async() => {
    // Arrange
    const input = createMock<SigninWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>({ role: AccountRole.SELLER, status: AccountStatus.ACTIVE });
    jest.spyOn(sut['findAccountByCredential'], 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.accessToken).not.toBeNull();
  });
});
