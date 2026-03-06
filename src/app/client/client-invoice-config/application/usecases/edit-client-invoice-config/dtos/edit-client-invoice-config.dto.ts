import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientInvoiceConfigInputDto } from '../../create-client-invoice-config/dtos/create-client-invoice-config.dto';

export class EditClientInvoiceConfigInputDto extends PartialType(
  OmitType(CreateClientInvoiceConfigInputDto, ['clientId'] as const),
  {
    skipNullProperties: false,
  }
) {}
