import { PartialType } from '@nestjs/swagger';
import { CreateCashFlowEntryInputDto } from '../../create-cash-flow-entry/dtos/create-cash-flow-entry.dto';

export class EditCashFlowEntryInputDto extends PartialType(CreateCashFlowEntryInputDto) {}
