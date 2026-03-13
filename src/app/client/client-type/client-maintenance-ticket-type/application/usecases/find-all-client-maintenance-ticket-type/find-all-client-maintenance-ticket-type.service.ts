import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientMaintenanceTicketTypeDto } from '../../dtos/client-maintenance-ticket-type.dto';
import type { IClientMaintenanceTicketTypeDao } from '../../persistence/dao/client-maintenance-ticket-type-dao.interface';
import { FindAllClientMaintenanceTicketTypeQueryDto } from './dtos/find-all-client-maintenance-ticket-type.dto';

@Injectable()
export class FindAllClientMaintenanceTicketType {
  constructor(
    @Inject(TOKENS.ClientMaintenanceTicketTypeDao) private readonly clientMaintenanceTicketTypeDao: IClientMaintenanceTicketTypeDao,
  ) {}

  public async execute(queries: FindAllClientMaintenanceTicketTypeQueryDto): Promise<IPagination<ClientMaintenanceTicketTypeDto>> {
    const [result, total] = await this.clientMaintenanceTicketTypeDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
