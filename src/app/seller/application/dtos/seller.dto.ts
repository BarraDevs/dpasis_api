import { CompanySummaryDto } from 'src/app/company/application/dtos/company.dto';

export class SellerDto {
  id: string;
  name: string;
  nickname: string | null;
  phone: string;
  cellphone: string;
  email: string;
  commission: number;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  reference: string | null;
  neighborhood: string;
  city: string;
  state: string;
  observation: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  companies: CompanySummaryDto[];
}

