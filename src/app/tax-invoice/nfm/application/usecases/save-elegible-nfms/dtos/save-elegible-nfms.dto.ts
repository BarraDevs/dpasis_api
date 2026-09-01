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
