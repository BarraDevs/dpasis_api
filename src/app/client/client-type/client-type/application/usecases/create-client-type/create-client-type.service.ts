import { Inject, Injectable } from '@nestjs/common';
import { FindClientAttendanceTypeById } from 'src/app/client/client-type/client-attendance-type/application/usecases/find-client-attendance-type-by-id/find-client-attendance-type-by-id.service';
import { FindClientDescriptionTypeById } from 'src/app/client/client-type/client-description-type/application/usecases/find-client-description-type-by-id/find-client-description-type-by-id.service';
import { FindClientDriveTypeById } from 'src/app/client/client-type/client-drive-type/application/usecases/find-client-drive-type-by-id/find-client-drive-type-by-id.service';
import { FindClientMaintenanceTicketTypeById } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-client-maintenance-ticket-type-by-id/find-client-maintenance-ticket-type-by-id.service';
import { FindClientSystemTypeById } from 'src/app/client/client-type/client-system-type/application/usecases/find-client-system-type-by-id/find-client-system-type-by-id.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IClientTypeDao } from '../../persistence/dao/client-type-dao.interface';
import { CreateClientTypeInputDto, CreateClientTypeOutputDto } from './dtos/create-client-type.dto';

@Injectable()
export class CreateClientType {
  constructor(
    @Inject(TOKENS.ClientTypeDao) private readonly clientTypeDao: IClientTypeDao,
    private readonly findClientById: FindClientById,
    private readonly findClientAttendanceTypeById: FindClientAttendanceTypeById,
    private readonly findClientMaintenanceTicketTypeById: FindClientMaintenanceTicketTypeById,
    private readonly findClientSystemTypeById: FindClientSystemTypeById,
    private readonly findClientDescriptionTypeById: FindClientDescriptionTypeById,
    private readonly findClientDriveTypeById: FindClientDriveTypeById,
  ) {}

  public async execute(data: CreateClientTypeInputDto): Promise<CreateClientTypeOutputDto> {
    await Promise.all([
      this.findClientById.execute(data.clientId, { onlyActive: true }),
      this.findClientAttendanceTypeById.execute(data.clientAttendanceTypeId, { onlyActive: true }),
      this.findClientMaintenanceTicketTypeById.execute(data.clientMaintenanceTicketTypeId, { onlyActive: true }),
      this.findClientSystemTypeById.execute(data.clientSystemTypeId, { onlyActive: true }),
      this.findClientDescriptionTypeById.execute(data.clientDescriptionTypeId, { onlyActive: true }),
      this.findClientDriveTypeById.execute(data.clientDriveTypeId, { onlyActive: true }),
    ]);

    const id = await this.clientTypeDao.save(data);
    return { id };
  }
}
