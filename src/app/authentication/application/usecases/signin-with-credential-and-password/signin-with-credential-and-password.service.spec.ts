import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import { FindAccountByCredential } from 'src/app/account/application/usecases/find-account-by-credential/find-account-by-credential.service';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { Password } from 'src/shared/value-objects/password/password.vo';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidCredentialError } from '../../errors/invalid-credential.error';
import { SignInWithCredentialAndPasswordInputDto } from './dtos/signin-with-credential-and-password.dto';
import { SignInWithCredentialAndPassword } from './signin-with-credential-and-password.service';

describe('SignInWithCredentialAndPassword - Unit tests', () => {
  let sut: SignInWithCredentialAndPassword;
  let findAccountByCredential: FindAccountByCredential;
  let jwtService: JwtService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        SignInWithCredentialAndPassword,
        {
          provide: FindAccountByCredential,
          useValue: createMock<FindAccountByCredential>(),
        },
        {
          provide: JwtService,
          useValue: createMock<JwtService>(),
        },
      ],
    }).compile();

    sut = module.get(SignInWithCredentialAndPassword);
    findAccountByCredential = module.get(FindAccountByCredential);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if account is not found', async() => {
    // Arrange
    const input = createMock<SignInWithCredentialAndPasswordInputDto>();
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(null);

    // Act & Assert
    expect.assertions(2);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  it('should throw an error if password is invalid', async() => {
    // Arrange
    const input = createMock<SignInWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>();
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(false);

    // Act & Assert
    expect.assertions(2);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  it('should throw an error if account status is inactive', async() => {
    // Arrange
    const input = createMock<SignInWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>({ role: AccountRole.SELLER, status: AccountStatus.INACTIVE });
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);

    // Act & Assert
    expect.assertions(2);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(InactiveAccountError);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  it('should throw an error if account status is not active', async() => {
    // Arrange
    const input = createMock<SignInWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>({ role: AccountRole.SELLER, status: AccountStatus.PENDING });
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);

    // Act & Assert
    expect.assertions(2);
    return sut.execute(input).catch((error) => {
      expect(error).toBeInstanceOf(ForbiddenAccountError);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  it('should return an access token if credentials are valid', async() => {
    // Arrange
    const input = createMock<SignInWithCredentialAndPasswordInputDto>();
    const account = createMock<AccountWithSensitiveDataDto>({ role: AccountRole.SELLER, status: AccountStatus.ACTIVE });
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.accessToken).not.toBeNull();
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
