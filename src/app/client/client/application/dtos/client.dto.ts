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
  group: ClientGroupDto;
  owner: ClientOwnerDto;
  companies: ClientCompanyDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class ClientGroupDto {
  id: number;
  name: string;
}

export class ClientOwnerDto {
  id: number;
  name: string;
}

export class ClientCompanyDto {
  id: number;
  name: string;
}
