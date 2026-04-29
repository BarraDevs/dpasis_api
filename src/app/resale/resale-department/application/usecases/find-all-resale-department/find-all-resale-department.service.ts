import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ResaleDepartmentDto } from '../../dtos/resale-department.dto';
import type { IResaleDepartmentDao } from '../../persistence/dao/resale-department-dao.interface';
import { FindAllResaleDepartmentQueryDto } from './dtos/find-all-resale-department.dto';

@Injectable()
export class FindAllResaleDepartment {
  constructor(
    @Inject(TOKENS.ResaleDepartmentDao) private readonly resaleDepartmentDao: IResaleDepartmentDao,
  ) {}

  public async execute(queries: FindAllResaleDepartmentQueryDto): Promise<IPagination<ResaleDepartmentDto>> {
    const [result, total] = await this.resaleDepartmentDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
