import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { DepartmentDto } from '../../dtos/department.dto';
import type { IDepartmentDao } from '../../persistence/dao/department-dao.interface';
import { FindAllDepartmentQueryDto } from './dtos/find-all-department.dto';

@Injectable()
export class FindAllDepartment {
  constructor(
    @Inject(TOKENS.DepartmentDao) private readonly departmentDao: IDepartmentDao,
  ) {}

  public async execute(queries: FindAllDepartmentQueryDto): Promise<IPagination<DepartmentDto>> {
    const [result, total] = await this.departmentDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
