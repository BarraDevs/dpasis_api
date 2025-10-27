import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto';
import { SignInWithCredentialAndPassword } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service';
export declare class AuthenticationController {
    private readonly signInWithCredentialAndPassword;
    constructor(signInWithCredentialAndPassword: SignInWithCredentialAndPassword);
    signInWithCredential(body: SigninWithCredentialAndPasswordInputDto): Promise<SigninWithCredentialAndPasswordOutputDto>;
}
