import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';

export class NfmDto {
  client: ClientDto;
  clientInvoiceConfig: ClientInvoiceConfigDto;
  clientItems: ClientItemDto[];
}
