import { ClientMaintenanceTicketDto } from '../../dtos/client-maintenance-ticket.dto';
import { CreateClientMaintenanceTicketInputDto } from '../../usecases/create-client-maintenance-ticket/dtos/create-client-maintenance-ticket.dto';
import { EditClientMaintenanceTicketInputDto } from '../../usecases/edit-client-maintenance-ticket/dtos/edit-client-maintenance-ticket.dto';
import { FindAllClientMaintenanceTicketQueryDto } from '../../usecases/find-all-client-maintenance-ticket/dtos/find-all-client-maintenance-ticket.dto';

export interface IClientMaintenanceTicketDao {
  findAll(queries: FindAllClientMaintenanceTicketQueryDto): Promise<[ClientMaintenanceTicketDto[], number]>;
  findById(id: number): Promise<ClientMaintenanceTicketDto | null>;
  findByName(name: string): Promise<ClientMaintenanceTicketDto | null>;
  save(data: CreateClientMaintenanceTicketInputDto): Promise<number>;
  edit(id: number, data: EditClientMaintenanceTicketInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
