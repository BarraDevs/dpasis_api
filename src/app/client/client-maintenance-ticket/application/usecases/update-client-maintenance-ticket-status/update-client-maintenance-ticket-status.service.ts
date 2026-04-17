import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientMaintenanceTicketNotFoundError } from '../../../domain/errors/client-maintenance-ticket-not-found.error';
import type { IClientMaintenanceTicketDao } from '../../persistence/dao/client-maintenance-ticket-dao.interface';

@Injectable()
export class UpdateClientMaintenanceTicketStatus {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketDao) private readonly clientMaintenanceTicketDao: IClientMaintenanceTicketDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientMaintenanceTicket = await this.clientMaintenanceTicketDao.findById(id);
    if (!clientMaintenanceTicket) {
      throw new ClientMaintenanceTicketNotFoundError();
    }

    await this.clientMaintenanceTicketDao.updateStatus(id, !clientMaintenanceTicket.active);

    return { message: 'Status do chamado de manutenção de cliente atualizado com sucesso' };
  }
}
