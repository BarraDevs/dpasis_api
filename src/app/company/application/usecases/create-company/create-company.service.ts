import { Inject, Injectable } from '@nestjs/common';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { CompanyDuplicateIeError } from 'src/app/company/domain/errors/duplicate-ie.error';
import { TOKENS } from 'src/core/di/token';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import { CreateCompanyInputDto, CreateCompanyOutputDto } from './dtos/create-company.dto';

@Injectable()
export class CreateCompany {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
  ) {}

  public async execute(data: CreateCompanyInputDto): Promise<CreateCompanyOutputDto> {
    const [doc, ie] = await Promise.all([
      this.companyDao.findByDocument(data.document),
      this.companyDao.findByIe(data.ie),
    ]);

    if (doc) {
      throw new CompanyDuplicateDocumentError();
    }
    if (ie) {
      throw new CompanyDuplicateIeError();
    }

    const companyId = await this.companyDao.save(data);

    return { id: companyId };
  }
}
