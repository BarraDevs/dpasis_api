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
  cnaeNbsIndopId: number;
  nfseId?: number | null;
  data: NfmDto;
}

export class EditNfmData {
  nfseId?: number | null;
  status: NfmStatus;
}

export class NfmPersistedRowDto {
  id: number;
  nfseId: number | null;
  status: string;
}

export class SaveElegibleNfmErrorDto {
  clientId: number;
  cnaeNbsIndopId: number;
  message: string;
}

export class SaveElegibleNfmsOutputDto {
  created: number;
  skipped: number;
  failed: number;
  errors: SaveElegibleNfmErrorDto[];
}
