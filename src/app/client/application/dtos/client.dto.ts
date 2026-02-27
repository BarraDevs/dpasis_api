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
  createdAt: Date;
  updatedAt: Date;
}
