import { CompanySummaryDto } from 'src/app/company/application/dtos/company.dto';

export class ShipperDto {
  id: string;
  companyName: string;
  fantasyName: string;
  cnpj: string;
  contact: string;
  representative: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  reference: string | null;
  neighborhood: string;
  city: string;
  state: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  companies: CompanySummaryDto[];
}
