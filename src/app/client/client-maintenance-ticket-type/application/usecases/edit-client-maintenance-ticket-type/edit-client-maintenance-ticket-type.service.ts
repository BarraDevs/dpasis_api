import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientMaintenanceTicketTypeAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-type-already-exists.error';
import { ClientMaintenanceTicketTypeNotFoundError } from '../../../domain/errors/client-maintenance-ticket-type-not-found.error';
import type { IClientMaintenanceTicketTypeDao } from '../../persistence/dao/client-maintenance-ticket-type-dao.interface';
import { EditClientMaintenanceTicketTypeInputDto } from './dtos/edit-client-maintenance-ticket-type.dto';

@Injectable()
export class EditClientMaintenanceTicketType {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketTypeDao) private readonly clientMaintenanceTicketTypeDao: IClientMaintenanceTicketTypeDao,
  ) {}

  public async execute(id: number, data: EditClientMaintenanceTicketTypeInputDto): Promise<SuccessMessage> {
    const clientMaintenanceTicketType = await this.clientMaintenanceTicketTypeDao.findById(id);
    if (!clientMaintenanceTicketType) {
      throw new ClientMaintenanceTicketTypeNotFoundError();
    }

    const existing = await this.clientMaintenanceTicketTypeDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientMaintenanceTicketTypeAlreadyExistsError(data.name);
    }

    await this.clientMaintenanceTicketTypeDao.edit(id, data);

    return { message: 'Tipo de chamado de manutenção de cliente atualizado com sucesso' };
  }
}
