import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientMaintenanceTicketDto } from '../../dtos/client-maintenance-ticket.dto';
import type { IClientMaintenanceTicketDao } from '../../persistence/dao/client-maintenance-ticket-dao.interface';
import { FindAllClientMaintenanceTicketQueryDto } from './dtos/find-all-client-maintenance-ticket.dto';

@Injectable()
export class FindAllClientMaintenanceTicket {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketDao) private readonly clientMaintenanceTicketDao: IClientMaintenanceTicketDao,
  ) {}

  public async execute(queries: FindAllClientMaintenanceTicketQueryDto): Promise<IPagination<ClientMaintenanceTicketDto>> {
    const [result, total] = await this.clientMaintenanceTicketDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
