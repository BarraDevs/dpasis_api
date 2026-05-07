import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { BooleanFilterDto } from 'src/shared/filtering/dtos/boolean-filter/boolean-filter.dto';
import { DateFilterDto } from 'src/shared/filtering/dtos/date-filter/date-filter.dto';
import { IntFilterDto } from 'src/shared/filtering/dtos/int-filter/int-filter.dto';
import { SearchRequestDto } from 'src/shared/filtering/dtos/search-request/search-request.dto';
import { StringFilterDto } from 'src/shared/filtering/dtos/string-filter/string-filter.dto';

export class ClientSearchFilterDto {
  @ApiPropertyOptional({ type: IntFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntFilterDto)
  id?: IntFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  type?: StringFilterDto;

  @ApiPropertyOptional({ type: IntFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntFilterDto)
  parentClientId?: IntFilterDto;

  @ApiPropertyOptional({ type: BooleanFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BooleanFilterDto)
  isSubClient?: BooleanFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  document?: StringFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  ie?: StringFilterDto;

  @ApiPropertyOptional({ type: IntFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntFilterDto)
  groupId?: IntFilterDto;

  @ApiPropertyOptional({ type: IntFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntFilterDto)
  resaleId?: IntFilterDto;

  @ApiPropertyOptional({ type: IntFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntFilterDto)
  attendanceId?: IntFilterDto;

  @ApiPropertyOptional({ type: IntFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntFilterDto)
  maintenanceTicketId?: IntFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  companyName?: StringFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  fantasyName?: StringFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  domain?: StringFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  headquarters?: StringFilterDto;

  @ApiPropertyOptional({ type: StringFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringFilterDto)
  invoiceType?: StringFilterDto;

  @ApiPropertyOptional({ type: BooleanFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BooleanFilterDto)
  generateInvoice?: BooleanFilterDto;

  @ApiPropertyOptional({ type: BooleanFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BooleanFilterDto)
  active?: BooleanFilterDto;

  @ApiPropertyOptional({ type: DateFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  createdAt?: DateFilterDto;

  @ApiPropertyOptional({ type: DateFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  updatedAt?: DateFilterDto;
}

export class SearchClientInputDto extends SearchRequestDto {
  @ApiPropertyOptional({ type: ClientSearchFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientSearchFilterDto)
  filter?: ClientSearchFilterDto;
}
