import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientMaintenanceTicketTypeNotFoundError } from '../../../domain/errors/client-maintenance-ticket-type-not-found.error';
import type { IClientMaintenanceTicketTypeDao } from '../../persistence/dao/client-maintenance-ticket-type-dao.interface';

@Injectable()
export class DeleteClientMaintenanceTicketType {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketTypeDao) private readonly clientMaintenanceTicketTypeDao: IClientMaintenanceTicketTypeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientMaintenanceTicketType = await this.clientMaintenanceTicketTypeDao.findById(id);
    if (!clientMaintenanceTicketType) {
      throw new ClientMaintenanceTicketTypeNotFoundError();
    }

    await this.clientMaintenanceTicketTypeDao.delete(id);

    return { message: 'Tipo de chamado de manutenção de cliente excluído com sucesso' };
  }
}
