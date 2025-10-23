import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FindAccountByCredential } from 'src/app/account/application/usecases/find-account-by-credential/find-account-by-credential.service';
import { Account } from 'src/app/account/domain/value-objects/account.vo';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { Password } from 'src/shared/value-objects/password/password.vo';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidCredentialError } from '../../errors/invalid-credential.error';
import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from './dtos/signin-with-credential-and-password.dto';

@Injectable()
export class SignInWithCredentialAndPassword {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findAccountByCredential: FindAccountByCredential,
  ) {}

  public async execute(data: SigninWithCredentialAndPasswordInputDto): Promise<SigninWithCredentialAndPasswordOutputDto> {
    const accountData = await this.findAccountByCredential.execute(data.credential);
    if (!accountData) {
      throw new InvalidCredentialError();
    }

    const isValidPassword = Password.compare(data.password, accountData.password);
    if (!isValidPassword) {
      throw new InvalidCredentialError();
    }

    const account = new Account(accountData.status, accountData.roles);
    if (account.isInactive) {
      throw new InactiveAccountError();
    }
    if (!account.isActive) {
      throw new ForbiddenAccountError();
    }

    const payload: Payload = {
      sub: accountData.id,
      roles: accountData.roles,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
