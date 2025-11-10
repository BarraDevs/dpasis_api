import { Inject, Injectable } from '@nestjs/common';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { CompanyDto } from '../../dtos/company.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';

@Injectable()
export class FindCompanyById {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
  ) {}

  public async execute(id: string): Promise<CompanyDto> {
    const company = await this.companyDao.findById(id);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    return company;
  }
}
