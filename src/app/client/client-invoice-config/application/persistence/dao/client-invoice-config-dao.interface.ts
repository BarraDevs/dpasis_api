import { ClientInvoiceConfigDto } from '../../dtos/client-invoice-config.dto';
import { FindAllClientInvoiceConfigQueryDto } from '../../usecases/find-all-client-invoice-config/dtos/find-all-client-invoice-config.dto';

export interface IClientInvoiceConfigDao {
  findAll(queries: FindAllClientInvoiceConfigQueryDto): Promise<[ClientInvoiceConfigDto[], number]>;
  findById(id: number): Promise<ClientInvoiceConfigDto | null>;
  findByClientId(clientId: number): Promise<ClientInvoiceConfigDto | null>;
}
