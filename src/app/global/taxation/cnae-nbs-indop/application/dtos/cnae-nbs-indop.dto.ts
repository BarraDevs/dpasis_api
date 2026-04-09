export class CnaeNbsIndopCodeDescriptionDto {
  id: number;
  code: string;
  description: string;
}

export class CnaeNbsIndopDto {
  id: number;
  active: boolean;
  cnae: CnaeNbsIndopCodeDescriptionDto;
  nbs: CnaeNbsIndopCodeDescriptionDto;
  indop: CnaeNbsIndopCodeDescriptionDto;
}
