import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class SignInWithCredentialAndPasswordInputDto {
  @ApiProperty({ example: 'admin@email.com' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  credential: string;

  @ApiProperty({ example: '123456' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  password: string;
}

export class SignInWithCredentialAndPasswordOutputDto {
  @ApiProperty({ example: 'token' })
  accessToken: string;
}
