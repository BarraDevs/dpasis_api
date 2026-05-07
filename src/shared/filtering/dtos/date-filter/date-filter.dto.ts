import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class DateFilterDto {
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: '$property deve estar no formato ISO 8601' })
  @Trim()
  eq?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: '$property deve estar no formato ISO 8601' })
  @Trim()
  ne?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: '$property deve estar no formato ISO 8601' })
  @Trim()
  gt?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: '$property deve estar no formato ISO 8601' })
  @Trim()
  gte?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601({}, { message: '$property deve estar no formato ISO 8601' })
  @Trim()
  lt?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601({}, { message: '$property deve estar no formato ISO 8601' })
  @Trim()
  lte?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  isNull?: boolean;
}
