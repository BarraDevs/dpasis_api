import { Inject, Injectable } from '@nestjs/common';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { ICompanyNfsConfigDao } from '../../persistence/dao/company-nfs-config-dao.interface';

@Injectable()
export class FindCompanyNfsConfigByCompanyId {
  constructor(
    @Inject(TOKENS.CompanyNfsConfigDao) private readonly companyNfsConfigDao: ICompanyNfsConfigDao,
  ) {}

  public async execute(companyId: number): Promise<CompanyNfsConfigDto> {
    const result = await this.companyNfsConfigDao.findByCompanyId(companyId);
    if (!result) {
      throw new CompanyNfsConfigNotFoundError();
    }

    return result;
  }
}
