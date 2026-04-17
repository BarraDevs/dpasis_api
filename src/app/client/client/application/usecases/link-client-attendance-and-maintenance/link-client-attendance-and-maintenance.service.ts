import { Inject, Injectable } from '@nestjs/common';
import { FindClientAttendanceById } from 'src/app/client/client-attendance/application/usecases/find-client-attendance-by-id/find-client-attendance-by-id.service';
import { FindClientMaintenanceTicketById } from 'src/app/client/client-maintenance-ticket/application/usecases/find-client-maintenance-ticket-by-id/find-client-maintenance-ticket-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { LinkClientAttendanceAndMaintenanceInputDto } from './dtos/link-client-attendance-and-maintenance.dto';

@Injectable()
export class LinkClientAttendanceAndMaintenance {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
    private readonly findClientAttendanceById: FindClientAttendanceById,
    private readonly findClientMaintenanceTicketById: FindClientMaintenanceTicketById,
  ) {}

  public async execute(clientId: number, data: LinkClientAttendanceAndMaintenanceInputDto): Promise<SuccessMessage> {
    const client = await this.clientDao.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError();
    }

    const attendance = await this.findClientAttendanceById.execute(data.attendanceId, { onlyActive: true });
    const maintenanceTicket = await this.findClientMaintenanceTicketById.execute(data.maintenanceTicketId, { onlyActive: true });

    await this.clientRepository.linkAttendanceAndMaintenance(
      clientId,
      attendance.id,
      maintenanceTicket.id,
    );

    return { message: 'Vínculo atualizado com sucesso' };
  }
}
