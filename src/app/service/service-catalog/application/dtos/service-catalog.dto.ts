import { MinimalCompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { CnaeNbsIndopDto } from 'src/app/global/taxation/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';

export class ServiceCatalogDto {
  id: number;
  name: string;
  unitPriceInCents: number;
  description: string;
  isCommercial: boolean;
  active: boolean;
  companies: MinimalCompanyDto[];
  cnaeNbsIndop: CnaeNbsIndopDto;
  billed: {
    id: number;
    description: string;
  };
  category: {
    id: number;
    name: string;
  };
  deliveryTerm: {
    id: number;
    name: string;
  };
  freight: {
    id: number;
    name: string;
  };
  proposalValidity: {
    id: number;
    name: string;
  };
  warranty: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
