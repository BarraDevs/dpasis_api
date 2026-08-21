import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export class FindNfsServicoPrestadoInputDto {
  provider: NfsProviderCredentialsDto;
  providerDocument: string;
  providerMunicipalRegistration?: string;
  page: number;
  /** ISO date YYYY-MM-DD — use with periodTo (XOR with nfseNumber) */
  periodFrom?: string;
  /** ISO date YYYY-MM-DD — use with periodFrom (XOR with nfseNumber) */
  periodTo?: string;
  /** Single NFS-e number (XOR with periodFrom/periodTo) */
  nfseNumber?: string;
  /** Optional taker CPF/CNPJ */
  takerDocument?: string;
}

export enum NfsNoteStatus {
  Normal = 'Normal',
  Cancelada = 'Cancelada',
}

export class NfsNoteAddressDto {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  cityCodeIbge: string | null;
  state: string | null;
  zipCode: string | null;
}

export class NfsNotePartyDto {
  document: string | null;
  name: string | null;
  municipalRegistration: string | null;
  email: string | null;
  phone: string | null;
  address: NfsNoteAddressDto | null;
}

export class NfsNoteValuesDto {
  serviceAmount: string | null;
  liquidAmount: string | null;
  calculationBase: string | null;
  issRate: string | null;
  issAmount: string | null;
  deductionsAmount: string | null;
  inssAmount: string | null;
  irAmount: string | null;
  csllAmount: string | null;
  otherWithholdingsAmount: string | null;
  unconditionalDiscount: string | null;
  conditionalDiscount: string | null;
}

export class NfsNoteServiceDto {
  description: string | null;
  serviceListItemCode: string | null;
  municipalTaxCode: string | null;
  municipalTaxCodeDescription: string | null;
  nbsCode: string | null;
  municipalityCode: string | null;
  countryCode: string | null;
  incidenceMunicipalityCode: string | null;
  issWithheld: boolean | null;
  issExigibility: number | null;
}

export class NfsNoteDto {
  nfseNumber: string;
  verificationCode: string;
  issueDate: string;
  competence: string | null;
  rpsNumber: number;
  rpsSeries: string;
  rpsType: number | null;
  rpsIssueDate: string | null;
  takerDocument: string | null;
  takerName: string | null;
  serviceAmount: string | null;
  liquidAmount: string | null;
  status: NfsNoteStatus;
  simpleNationalOptant: boolean | null;
  fiscalIncentive: boolean | null;
  generatorMunicipalityCode: string | null;
  generatorUf: string | null;
  provider: NfsNotePartyDto;
  taker: NfsNotePartyDto;
  values: NfsNoteValuesDto;
  service: NfsNoteServiceDto;
}
