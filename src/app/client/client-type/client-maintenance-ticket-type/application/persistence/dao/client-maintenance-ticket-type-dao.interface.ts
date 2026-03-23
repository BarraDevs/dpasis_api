import { ClientMaintenanceTicketTypeDto } from '../../dtos/client-maintenance-ticket-type.dto';
import { CreateClientMaintenanceTicketTypeInputDto } from '../../usecases/create-client-maintenance-ticket-type/dtos/create-client-maintenance-ticket-type.dto';
import { EditClientMaintenanceTicketTypeInputDto } from '../../usecases/edit-client-maintenance-ticket-type/dtos/edit-client-maintenance-ticket-type.dto';
import { FindAllClientMaintenanceTicketTypeQueryDto } from '../../usecases/find-all-client-maintenance-ticket-type/dtos/find-all-client-maintenance-ticket-type.dto';

export interface IClientMaintenanceTicketTypeDao {
  findAll(queries: FindAllClientMaintenanceTicketTypeQueryDto): Promise<[ClientMaintenanceTicketTypeDto[], number]>;
  findById(id: number): Promise<ClientMaintenanceTicketTypeDto | null>;
  findByName(name: string): Promise<ClientMaintenanceTicketTypeDto | null>;
  save(data: CreateClientMaintenanceTicketTypeInputDto): Promise<number>;
  edit(id: number, data: EditClientMaintenanceTicketTypeInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countClientTypesByMaintenanceTicketTypeId(maintenanceTicketTypeId: number): Promise<number>;
}
