export class ClientDto {
  id: number;
  type: string;
  document: string;
  ie: string | null;
  companyName: string;
  fantasyName: string | null;
  headquarters: string;
  invoiceType: string;
  generateInvoice: boolean;
  active: boolean;
  group: {
    id: number;
    name: string;
  };
  owner: {
    id: number;
    name: string;
  };
  companies: ClientCompanyDto[];
  createdAt: Date;
  updatedAt: Date;
}

class ClientCompanyDto {
  id: number;
  name: string;
}
