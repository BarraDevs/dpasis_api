import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllAuditLogQueryDto extends Queries {
  @ApiPropertyOptional({ description: 'Filtrar por ID da conta que realizou a ação' })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  accountId?: number;

  @ApiPropertyOptional({
    enum: ['POST', 'PATCH', 'PUT', 'DELETE', 'JOB'],
    description: 'Filtrar por método HTTP, ou `JOB` para as transições do caminho assíncrono '
      + '(envio ao provedor, consulta do lote, reconciliação, boleto).',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsIn(['POST', 'PATCH', 'PUT', 'DELETE', 'JOB'], { message: '$property deve ser POST, PATCH, PUT, DELETE ou JOB' })
  @Trim()
  method?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Data inicial (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Data final (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  endDate?: string;
}
