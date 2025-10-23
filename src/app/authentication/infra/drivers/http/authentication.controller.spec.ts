import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { AuthenticationController } from './authentication.controller';

describe('AuthenticationController', () => {
  let sut: AuthenticationController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationModule],
    }).compile();

    sut = module.get(AuthenticationController);
  });

  it('should login', async() => {
    // Arrange
    const body = createMock<SigninWithCredentialAndPasswordInputDto>();
    const output = createMock<SigninWithCredentialAndPasswordOutputDto>();
    const signinSpy = jest.spyOn(sut['signInWithCredentialAndPassword'], 'execute').mockResolvedValue(output);

    // Act
    const result = await sut.signInWithCredential(body);

    // Assert
    expect(result).toEqual(output);
    expect(signinSpy).toHaveBeenCalledWith(body);
  });

  // it('should forgot password only admins', async() => {
  //   // Arrange
  //   const body = createMock<ForgotPasswordInputDto>();
  //   const output = createMock<SuccessMessage>();
  //   const forgotPasswordSpy = jest.spyOn(sut['forgotPassword'], 'execute').mockResolvedValue(output);

  //   // Act
  //   const result = await sut.forgotPass(body);

  //   // Assert
  //   expect(result).toEqual(output);
  //   expect(forgotPasswordSpy).toHaveBeenCalledWith(body, AccountRole.ADMIN);
  // });

  // it('should reset password only admins', async() => {
  //   // Arrange
  //   const body = createMock<ResetPasswordInputDto>();
  //   const output = createMock<SuccessMessage>();
  //   const resetPasswordSpy = jest.spyOn(sut['resetPassword'], 'execute').mockResolvedValue(output);

  //   // Act
  //   const result = await sut.resetPass(body);

  //   // Assert
  //   expect(result).toEqual(output);
  //   expect(resetPasswordSpy).toHaveBeenCalledWith(body, AccountRole.ADMIN);
  // });
});
