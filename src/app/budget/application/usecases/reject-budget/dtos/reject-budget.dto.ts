import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class RejectBudgetInputDto {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(512, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  reason: string;

  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  accountId: string;
}
