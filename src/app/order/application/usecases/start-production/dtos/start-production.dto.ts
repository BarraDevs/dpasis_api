import { IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class StartProductionInputDto {
  @IsOptional()
  @IsString({ message: 'observation deve ser uma string' })
  @Trim()
  observation?: string;
}
