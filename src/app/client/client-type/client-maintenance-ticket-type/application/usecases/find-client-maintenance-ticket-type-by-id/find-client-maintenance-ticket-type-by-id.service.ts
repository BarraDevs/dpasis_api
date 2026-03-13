import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientMaintenanceTicketTypeNotFoundError } from '../../../domain/errors/client-maintenance-ticket-type-not-found.error';
import { ClientMaintenanceTicketTypeDto } from '../../dtos/client-maintenance-ticket-type.dto';
import type { IClientMaintenanceTicketTypeDao } from '../../persistence/dao/client-maintenance-ticket-type-dao.interface';

@Injectable()
export class FindClientMaintenanceTicketTypeById {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketTypeDao) private readonly clientMaintenanceTicketTypeDao: IClientMaintenanceTicketTypeDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientMaintenanceTicketTypeDto> {
    const clientMaintenanceTicketType = await this.clientMaintenanceTicketTypeDao.findById(id);
    if (!clientMaintenanceTicketType) {
      throw new ClientMaintenanceTicketTypeNotFoundError();
    }
    if (options.onlyActive && !clientMaintenanceTicketType.active) {
      throw new ClientMaintenanceTicketTypeNotFoundError();
    }

    return clientMaintenanceTicketType;
  }
}
