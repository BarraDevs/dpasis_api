import { MinimalCompanyDto } from 'src/app/company/application/dtos/company.dto';
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
  serviceBilled: {
    id: number;
    description: string;
  };
  serviceCategory: {
    id: number;
    name: string;
  };
  serviceDeliveryTerm: {
    id: number;
    name: string;
  };
  serviceFreight: {
    id: number;
    name: string;
  };
  serviceProposalValidity: {
    id: number;
    name: string;
  };
  serviceWarranty: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
