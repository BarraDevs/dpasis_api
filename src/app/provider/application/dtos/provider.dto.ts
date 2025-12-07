import { CompanySummaryDto } from 'src/app/company/application/dtos/company.dto';

export class ProviderDto {
  id: string;
  name: string;
  type: string;
  valueInCents: number;
  cnpj: string;
  ie: string;
  paymentDay: number | null;
  paymentExpirationDate: Date | null;
  companyName: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  reference: string | null;
  neighborhood: string;
  city: string;
  state: string;
  email: string;
  website: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  companies: CompanySummaryDto[];
}


