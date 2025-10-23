import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto';
import { SignInWithCredentialAndPassword } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly signInWithCredentialAndPassword: SignInWithCredentialAndPassword,
    // private readonly forgotPassword: ForgotPassword,
    // private readonly resetPassword: ResetPassword
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Login com email e senha',
    applyBadRequest: true,
    applyForbidden: true,
    okResponse: SigninWithCredentialAndPasswordOutputDto,
  })
  public async signInWithCredential(@Body() body: SigninWithCredentialAndPasswordInputDto): Promise<SigninWithCredentialAndPasswordOutputDto> {
    return this.signInWithCredentialAndPassword.execute(body);
  }

  // @Post('forgot-password')
  // @HttpCode(HttpStatus.OK)
  // public async forgotPass(@Body() body: ForgotPasswordInputDto): Promise<SuccessMessage> {
  //   return this.forgotPassword.execute(body);
  // }

  // @Post('reset-password')
  // @HttpCode(HttpStatus.OK)
  // public async resetPass(@Body() body: ResetPasswordInputDto): Promise<SuccessMessage> {
  //   return this.resetPassword.execute(body);
  // }
}
