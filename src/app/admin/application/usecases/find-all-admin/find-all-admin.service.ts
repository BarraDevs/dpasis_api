import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AdminListDto } from '../../dtos/admin.dto';
import type { IAdminDao } from '../../persistence/dao/admin-dao.interface';
import { FindAllAdminQueryDto } from './dtos/find-all-admin.dto';

@Injectable()
export class FindAllAdmin {
  constructor(
    @Inject(TOKENS.AdminDao) private readonly adminDao: IAdminDao,
  ) {}

  public async execute(queries: FindAllAdminQueryDto): Promise<IPagination<AdminListDto>> {
    const [result, total] = await this.adminDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
