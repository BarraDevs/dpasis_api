export class NfInvalidationDto {
  environment: number;
  year: number;
  series: number;
  startNumber: number;
  endNumber: number;
  reason: string;
}

export class FindAllNfInvalidationsInputDto {
  year: number;
  page?: number;
  limit?: number;
}

export class FindAllNfInvalidationsOutputDto {
  rows: NfInvalidationDto[];
  page: number;
  limit: number;
  total: number;
}
