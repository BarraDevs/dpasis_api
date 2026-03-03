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
  group: GroupDto;
  owner: OwnerDto;
  companies: ClientCompanyDto[];
  createdAt: Date;
  updatedAt: Date;
}

class GroupDto {
  id: number;
  name: string;
}

class OwnerDto {
  id: number;
  name: string;
}

class ClientCompanyDto {
  id: number;
  name: string;
}
