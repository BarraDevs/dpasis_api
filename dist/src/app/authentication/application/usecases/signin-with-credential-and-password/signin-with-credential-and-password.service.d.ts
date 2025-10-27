import { JwtService } from '@nestjs/jwt';
import { FindAccountByCredential } from 'src/app/account/application/usecases/find-account-by-credential/find-account-by-credential.service';
import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from './dtos/signin-with-credential-and-password.dto';
export declare class SignInWithCredentialAndPassword {
    private readonly jwtService;
    private readonly findAccountByCredential;
    constructor(jwtService: JwtService, findAccountByCredential: FindAccountByCredential);
    execute(data: SigninWithCredentialAndPasswordInputDto): Promise<SigninWithCredentialAndPasswordOutputDto>;
}
