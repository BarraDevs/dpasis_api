export class CnaeNbsIndopCodeDescriptionDto {
  id: number;
  code: string;
  description: string;
}

export class CnaeNbsIndopDto {
  id: number;
  cnae: CnaeNbsIndopCodeDescriptionDto;
  nbs: CnaeNbsIndopCodeDescriptionDto;
  indop: CnaeNbsIndopCodeDescriptionDto;
}
