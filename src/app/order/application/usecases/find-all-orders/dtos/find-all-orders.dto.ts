import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllOrdersQueryDto extends Queries {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: '$property deve ser um status válido' })
  status?: OrderStatus;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  clientId?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  sellerId?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsUUID('4', { message: '$property deve ser um UUID válido' })
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: '$property deve ser uma data válida no formato ISO8601' })
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: '$property deve ser uma data válida no formato ISO8601' })
  dateTo?: string;
}
