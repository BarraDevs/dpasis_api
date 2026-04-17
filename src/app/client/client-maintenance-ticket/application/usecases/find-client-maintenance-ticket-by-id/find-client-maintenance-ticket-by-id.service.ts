import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientMaintenanceTicketNotFoundError } from '../../../domain/errors/client-maintenance-ticket-not-found.error';
import { ClientMaintenanceTicketDto } from '../../dtos/client-maintenance-ticket.dto';
import type { IClientMaintenanceTicketDao } from '../../persistence/dao/client-maintenance-ticket-dao.interface';

@Injectable()
export class FindClientMaintenanceTicketById {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketDao) private readonly clientMaintenanceTicketDao: IClientMaintenanceTicketDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientMaintenanceTicketDto> {
    const clientMaintenanceTicket = await this.clientMaintenanceTicketDao.findById(id);
    if (!clientMaintenanceTicket) {
      throw new ClientMaintenanceTicketNotFoundError();
    }
    if (options.onlyActive && !clientMaintenanceTicket.active) {
      throw new ClientMaintenanceTicketNotFoundError();
    }

    return clientMaintenanceTicket;
  }
}
