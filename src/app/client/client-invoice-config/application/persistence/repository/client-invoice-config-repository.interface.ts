import { ClientInvoiceConfig } from 'src/app/client/client-invoice-config/domain/entities/client-invoice-config.entity';

export interface IClientInvoiceConfigRepository {
  save(entity: ClientInvoiceConfig): Promise<number>;
  edit(entity: ClientInvoiceConfig): Promise<void>;
  findById(id: number): Promise<ClientInvoiceConfig | null>;
  findByClientId(clientId: number): Promise<ClientInvoiceConfig | null>;
  delete(id: number): Promise<void>;
}
