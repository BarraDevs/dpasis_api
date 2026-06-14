import { NfDto } from './nf.dto';

export class FindAllNfInputDto {
  page?: number;
  limit?: number;
  processCode?: number;
}

export class FindAllNfOutputDto {
  rows: NfDto[];
  page: number;
  limit: number;
  total: number;
}
