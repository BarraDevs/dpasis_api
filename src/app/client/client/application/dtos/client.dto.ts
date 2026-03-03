export class ClientDto {
  id: number;
  type: string;
  document: string;
  ie: string | null;
  groupId: number;
  ownerId: number;
  companyName: string;
  fantasyName: string | null;
  headquarters: string;
  invoiceType: string;
  generateInvoice: boolean;
  active: boolean;
  companies: ClientCompanyDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class ClientCompanyDto {
  id: number;
  name: string;
}
