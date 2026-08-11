import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CompanyDto } from '../../dtos/company.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import { FindAllCompanyQueryDto } from './dtos/find-all-company.dto';

@Injectable()
export class FindAllCompany {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
  ) {}

  public async execute(queries: FindAllCompanyQueryDto): Promise<IPagination<CompanyDto>> {
    const [result, total] = await this.companyDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
