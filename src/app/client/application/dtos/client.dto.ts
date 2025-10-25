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
  mainAddressId: string | null;
  createdAt: Date;
  updatedAt: Date;
  address?: Array<{
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string | null;
    reference: string | null;
    city: string;
    state: string;
  }>;
  contacts?: Array<{
    name: string;
    email: string;
    whatsapp: string;
    department: string | null;
    phone: string | null;
    information: string | null;
  }>;
  licenses?: Array<{
    id: string;
    paymentDay: number;
    bonus: number;
    chargingDateStart: Date;
    chargingDateEnd: Date | null;
    active: boolean;
    license: string;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    createdAt: Date;
  }>;
  itens?: Array<{
    id: string;
    description: string;
    code: string;
    quantity: number;
    unitValue: number;
    adjustment: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
