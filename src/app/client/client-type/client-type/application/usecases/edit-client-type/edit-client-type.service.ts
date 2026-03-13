import { Inject, Injectable } from '@nestjs/common';
import { FindClientAttendanceTypeById } from 'src/app/client/client-type/client-attendance-type/application/usecases/find-client-attendance-type-by-id/find-client-attendance-type-by-id.service';
import { FindClientDescriptionTypeById } from 'src/app/client/client-type/client-description-type/application/usecases/find-client-description-type-by-id/find-client-description-type-by-id.service';
import { FindClientDriveTypeById } from 'src/app/client/client-type/client-drive-type/application/usecases/find-client-drive-type-by-id/find-client-drive-type-by-id.service';
import { FindClientMaintenanceTicketTypeById } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-client-maintenance-ticket-type-by-id/find-client-maintenance-ticket-type-by-id.service';
import { FindClientSystemTypeById } from 'src/app/client/client-type/client-system-type/application/usecases/find-client-system-type-by-id/find-client-system-type-by-id.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientTypeNotFoundError } from '../../../domain/errors/client-type-not-found.error';
import type { IClientTypeDao } from '../../persistence/dao/client-type-dao.interface';
import { EditClientTypeInputDto } from './dtos/edit-client-type.dto';

@Injectable()
export class EditClientType {
  constructor(
    @Inject(TOKENS.ClientTypeDao) private readonly clientTypeDao: IClientTypeDao,
    private readonly findClientById: FindClientById,
    private readonly findClientAttendanceTypeById: FindClientAttendanceTypeById,
    private readonly findClientMaintenanceTicketTypeById: FindClientMaintenanceTicketTypeById,
    private readonly findClientSystemTypeById: FindClientSystemTypeById,
    private readonly findClientDescriptionTypeById: FindClientDescriptionTypeById,
    private readonly findClientDriveTypeById: FindClientDriveTypeById,
  ) {}

  public async execute(id: number, data: EditClientTypeInputDto): Promise<SuccessMessage> {
    const clientType = await this.clientTypeDao.findById(id);
    if (!clientType) {
      throw new ClientTypeNotFoundError();
    }

    if (data.clientAttendanceTypeId != null) {
      await this.findClientAttendanceTypeById.execute(data.clientAttendanceTypeId, { onlyActive: true });
    }
    if (data.clientMaintenanceTicketTypeId != null) {
      await this.findClientMaintenanceTicketTypeById.execute(data.clientMaintenanceTicketTypeId, { onlyActive: true });
    }
    if (data.clientSystemTypeId != null) {
      await this.findClientSystemTypeById.execute(data.clientSystemTypeId, { onlyActive: true });
    }
    if (data.clientDescriptionTypeId != null) {
      await this.findClientDescriptionTypeById.execute(data.clientDescriptionTypeId, { onlyActive: true });
    }
    if (data.clientDriveTypeId != null) {
      await this.findClientDriveTypeById.execute(data.clientDriveTypeId, { onlyActive: true });
    }

    await this.clientTypeDao.edit(id, data);

    return { message: 'Tipo de cliente atualizado com sucesso' };
  }
}
