import { MinimalCompanyDto } from 'src/app/company/application/dtos/company.dto';

export class ClientDto {
  id: number;
  type: string;
  document: string;
  ie: string | null;
  parentClientId: number | null;
  isSubClient: boolean;
  attendanceId: number | null;
  maintenanceTicketId: number | null;
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
  companies: MinimalCompanyDto[];
  createdAt: Date;
  updatedAt: Date;
}
