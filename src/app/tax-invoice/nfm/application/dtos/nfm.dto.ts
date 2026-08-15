import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { NfmStatus } from '../../domain/enums/nfm-status.enum';

export class NfmDto {
  client: ClientDto;
  clientInvoiceConfig: ClientInvoiceConfigDto;
  clientItems: ClientItemDto[];
}

export class NfmWithNfseDto {
  id: number;
  clientId: number;
  clientDocument: string;
  companyName: string;
  status: NfmStatus;
  referenceMonth: number;
  referenceYear: number;
  totalValueInCents: number;
  cnaeNbsIndopId: number;
  createdAt: Date;
  updatedAt: Date;
  nfse: NfseDto;
}
