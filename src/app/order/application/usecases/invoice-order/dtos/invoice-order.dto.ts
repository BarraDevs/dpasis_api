import { IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class InvoiceOrderInputDto {
  @Trim()
  @IsOptional()
  @IsString({ message: 'observation deve ser uma string' })
  observation?: string;
}
