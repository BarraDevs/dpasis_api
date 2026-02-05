import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CancelOrderInputDto {
  @Trim()
  @IsNotEmpty({ message: 'reason é obrigatório' })
  @IsString({ message: 'reason deve ser uma string' })
  reason: string;

  @Trim()
  @IsOptional()
  @IsString({ message: 'observation deve ser uma string' })
  observation?: string;
}
