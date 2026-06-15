import { NfProcessCode } from '../enums/nf-process-code.enum';

export class FindAllNfInputDto {
  page?: number;
  limit?: number;
  orderNumber?: string;
  nfeNumber?: number;
  recipientDocument?: string;
  processCode?: NfProcessCode;
}
