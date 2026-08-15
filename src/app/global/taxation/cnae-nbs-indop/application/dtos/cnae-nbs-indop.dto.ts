export class CnaeNbsIndopCodeDescriptionDto {
  id: number;
  code: string;
  description: string;
}

export class CnaeNbsIndopDto {
  id: number;
  active: boolean;
  serviceListItemCode: string | null;
  cnae: CnaeNbsIndopCodeDescriptionDto;
  nbs: CnaeNbsIndopCodeDescriptionDto;
  indop: CnaeNbsIndopCodeDescriptionDto;
}
