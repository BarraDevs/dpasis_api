import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAttendanceDto } from '../../dtos/client-attendance.dto';
import type { IClientAttendanceDao } from '../../persistence/dao/client-attendance-dao.interface';
import { FindAllClientAttendanceQueryDto } from './dtos/find-all-client-attendance.dto';

@Injectable()
export class FindAllClientAttendance {
  constructor(
    @Inject(TOKENS.ClientAttendanceDao) private readonly clientAttendanceDao: IClientAttendanceDao,
  ) {}

  public async execute(queries: FindAllClientAttendanceQueryDto): Promise<IPagination<ClientAttendanceDto>> {
    const [result, total] = await this.clientAttendanceDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
