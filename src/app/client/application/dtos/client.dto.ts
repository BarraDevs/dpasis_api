export class ClientDto {
  id: string;
  kind: string;
  cnpj: string;
  ie: string;
  group: string;
  type: string;
  generateInvoice: boolean;
  companyName: string;
  fantasyName: string;
  owner: string;
  headquarters: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  companies: ClientCompanyDto[];
}

class ClientCompanyDto {
  id: string;
  name: string;
}
