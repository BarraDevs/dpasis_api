import { NfmDto } from '../../../dtos/nfm.dto';
import { NfmStatus } from '../../../../domain/enums/nfm-status.enum';

export class SaveNfmData {
  clientId: number;
  clientDocument: string;
  companyName: string;
  status: NfmStatus;
  referenceMonth: number;
  referenceYear: number;
  totalValueInCents: number;
  data: NfmDto;
}

export class SaveElegibleNfmsOutputDto {
  created: number;
}
