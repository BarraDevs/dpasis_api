import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientMaintenanceTicketAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-already-exists.error';
import type { IClientMaintenanceTicketDao } from '../../persistence/dao/client-maintenance-ticket-dao.interface';
import { CreateClientMaintenanceTicketInputDto, CreateClientMaintenanceTicketOutputDto } from './dtos/create-client-maintenance-ticket.dto';

@Injectable()
export class CreateClientMaintenanceTicket {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketDao) private readonly clientMaintenanceTicketDao: IClientMaintenanceTicketDao,
  ) {}

  public async execute(data: CreateClientMaintenanceTicketInputDto): Promise<CreateClientMaintenanceTicketOutputDto> {
    const existing = await this.clientMaintenanceTicketDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientMaintenanceTicketAlreadyExistsError(data.name);
    }

    const id = await this.clientMaintenanceTicketDao.save(data);
    return { id };
  }
}
