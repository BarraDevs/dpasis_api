import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { LicenseDto } from '../../dtos/license.dto';
import type { ILicenseDao } from '../../persistence/dao/license-dao.interface';
import { FindAllLicenseQueryDto } from './dtos/find-all-license.dto';

@Injectable()
export class FindAllLicense {
  constructor(
    @Inject(TOKENS.LicenseDao) private readonly licenseDao: ILicenseDao,
  ) {}

  public async execute(queries: FindAllLicenseQueryDto): Promise<IPagination<LicenseDto>> {
    const [result, total] = await this.licenseDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
