import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientMaintenanceTicketAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-already-exists.error';
import { ClientMaintenanceTicketNotFoundError } from '../../../domain/errors/client-maintenance-ticket-not-found.error';
import type { IClientMaintenanceTicketDao } from '../../persistence/dao/client-maintenance-ticket-dao.interface';
import { EditClientMaintenanceTicketInputDto } from './dtos/edit-client-maintenance-ticket.dto';

@Injectable()
export class EditClientMaintenanceTicket {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketDao) private readonly clientMaintenanceTicketDao: IClientMaintenanceTicketDao,
  ) {}

  public async execute(id: number, data: EditClientMaintenanceTicketInputDto): Promise<SuccessMessage> {
    const clientMaintenanceTicket = await this.clientMaintenanceTicketDao.findById(id);
    if (!clientMaintenanceTicket) {
      throw new ClientMaintenanceTicketNotFoundError();
    }

    const existing = await this.clientMaintenanceTicketDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientMaintenanceTicketAlreadyExistsError(data.name);
    }

    await this.clientMaintenanceTicketDao.edit(id, data);

    return { message: 'Chamado de manutenção de cliente atualizado com sucesso' };
  }
}
