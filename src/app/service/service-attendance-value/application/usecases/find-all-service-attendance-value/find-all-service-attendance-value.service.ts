import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceAttendanceValueDto } from '../../dtos/service-attendance-value.dto';
import type { IServiceAttendanceValueDao } from '../../persistence/dao/service-attendance-value-dao.interface';
import { FindAllServiceAttendanceValueQueryDto } from './dtos/find-all-service-attendance-value.dto';

@Injectable()
export class FindAllServiceAttendanceValue {
  constructor(
    @Inject(TOKENS.ServiceAttendanceValueDao) private readonly serviceAttendanceValueDao: IServiceAttendanceValueDao,
  ) {}

  public async execute(queries: FindAllServiceAttendanceValueQueryDto): Promise<IPagination<ServiceAttendanceValueDto>> {
    const [result, total] = await this.serviceAttendanceValueDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
