import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDepartmentDto } from '../../dtos/client-department.dto';
import type { IClientDepartmentDao } from '../../persistence/dao/client-department-dao.interface';
import { FindAllClientDepartmentQueryDto } from './dtos/find-all-client-department.dto';

@Injectable()
export class FindAllClientDepartment {
  constructor(
    @Inject(TOKENS.ClientDepartmentDao) private readonly clientDepartmentDao: IClientDepartmentDao,
  ) {}

  public async execute(queries: FindAllClientDepartmentQueryDto): Promise<IPagination<ClientDepartmentDto>> {
    const [result, total] = await this.clientDepartmentDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
