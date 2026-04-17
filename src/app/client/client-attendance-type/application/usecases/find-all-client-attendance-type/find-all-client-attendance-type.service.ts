import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAttendanceTypeDto } from '../../dtos/client-attendance-type.dto';
import type { IClientAttendanceTypeDao } from '../../persistence/dao/client-attendance-type-dao.interface';
import { FindAllClientAttendanceTypeQueryDto } from './dtos/find-all-client-attendance-type.dto';

@Injectable()
export class FindAllClientAttendanceType {
  constructor(
    @Inject(TOKENS.ClientAttendanceTypeDao) private readonly clientAttendanceTypeDao: IClientAttendanceTypeDao,
  ) {}

  public async execute(queries: FindAllClientAttendanceTypeQueryDto): Promise<IPagination<ClientAttendanceTypeDto>> {
    const [result, total] = await this.clientAttendanceTypeDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
