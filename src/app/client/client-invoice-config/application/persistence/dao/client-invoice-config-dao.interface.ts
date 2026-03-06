import { ClientInvoiceConfigDto } from '../../dtos/client-invoice-config.dto';

export interface IClientInvoiceConfigDao {
  findById(id: number): Promise<ClientInvoiceConfigDto | null>;
  findByClientId(clientId: number): Promise<ClientInvoiceConfigDto | null>;
}
