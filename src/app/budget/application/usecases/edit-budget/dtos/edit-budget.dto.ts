import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBudgetInputDto } from '../../create-budget/dtos/create-budget.dto';

export class EditBudgetInputDto extends PartialType(
  OmitType(CreateBudgetInputDto, ['clientId']),
  { skipNullProperties: false }
) {}
