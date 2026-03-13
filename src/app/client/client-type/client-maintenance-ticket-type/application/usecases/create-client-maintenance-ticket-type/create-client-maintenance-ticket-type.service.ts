import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientMaintenanceTicketTypeAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-type-already-exists.error';
import type { IClientMaintenanceTicketTypeDao } from '../../persistence/dao/client-maintenance-ticket-type-dao.interface';
import { CreateClientMaintenanceTicketTypeInputDto, CreateClientMaintenanceTicketTypeOutputDto } from './dtos/create-client-maintenance-ticket-type.dto';

@Injectable()
export class CreateClientMaintenanceTicketType {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketTypeDao) private readonly clientMaintenanceTicketTypeDao: IClientMaintenanceTicketTypeDao,
  ) {}

  public async execute(data: CreateClientMaintenanceTicketTypeInputDto): Promise<CreateClientMaintenanceTicketTypeOutputDto> {
    const existing = await this.clientMaintenanceTicketTypeDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientMaintenanceTicketTypeAlreadyExistsError(data.name);
    }

    const id = await this.clientMaintenanceTicketTypeDao.save(data);
    return { id };
  }
}
