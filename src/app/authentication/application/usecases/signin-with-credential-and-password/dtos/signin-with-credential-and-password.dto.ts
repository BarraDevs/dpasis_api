import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class SigninWithCredentialAndPasswordInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  credential: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  password: string;
}

export class SigninWithCredentialAndPasswordOutputDto {
  accessToken: string;
}
