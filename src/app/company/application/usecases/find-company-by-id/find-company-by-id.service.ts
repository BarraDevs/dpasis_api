import { Inject, Injectable } from '@nestjs/common';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { CompanyDto } from '../../dtos/company.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';

@Injectable()
export class FindCompanyById {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<CompanyDto> {
    const result = await this.companyDao.findById(id);
    if (!result) {
      throw new CompanyNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new CompanyNotFoundError();
    }

    return result;
  }
}
