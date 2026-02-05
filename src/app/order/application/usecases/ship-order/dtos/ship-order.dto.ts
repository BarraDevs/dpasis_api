import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class ShipOrderInputDto {
  @Trim()
  @IsNotEmpty({ message: 'trackingCode é obrigatório' })
  @IsString({ message: 'trackingCode deve ser uma string' })
  trackingCode: string;

  @Trim()
  @IsOptional()
  @IsString({ message: 'observation deve ser uma string' })
  observation?: string;
}
