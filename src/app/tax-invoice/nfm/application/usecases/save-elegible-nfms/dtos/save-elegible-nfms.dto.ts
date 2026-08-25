import { NfmDto } from '../../../dtos/nfm.dto';

export class SaveNfmData {
  clientId: number;
  clientDocument: string;
  companyName: string;
  referenceMonth: number;
  referenceYear: number;
  totalValueInCents: number;
  cnaeNbsIndopId: number;
  nfseId?: number | null;
  data: NfmDto;
}

export class EditNfmData {
  nfseId?: number | null;
}

export class NfmPersistedRowDto {
  id: number;
  nfseId: number | null;
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
