import { CompanySummaryDto } from 'src/app/company/application/dtos/company.dto';

export class SupplierDto {
  id: string;
  cnpj: string;
  ie: string;
  group: string;
  type: string;
  companyName: string;
  fantasyName: string;
  representative: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  companies: CompanySummaryDto[];
}
