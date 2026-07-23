export enum NfsIssExigibility {
  Payable = 1,
  NonIncidence = 2,
  Exemption = 3,
  Export = 4,
  Immunity = 5,
  SuspendedByJudicialDecision = 6,
  SuspendedByAdministrativeProcess = 7,
}

export class NfsServiceDto {
  serviceListItemCode: string; // subitem LC 116/2003 (ItemListaServico)
  nbsCode: string;
  description: string; // Discriminacao
  serviceMunicipalCodeIbge: string; // município da prestação
  issExigibility: NfsIssExigibility;
  issWithheld: boolean;
  cnaeCode?: string;
  municipalTaxCode?: string;

  servicesValue: number; // ValorServicos
  deductionsValue?: number;
  inssValue?: number;
  irValue?: number;
  csllValue?: number;
  otherWithholdingsValue?: number;
  issValue?: number;
  issRate?: number;
  unconditionalDiscount?: number;
  conditionalDiscount?: number;
}
