import { Inject, Injectable } from '@nestjs/common';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { CompanyDuplicateIeError } from 'src/app/company/domain/errors/duplicate-ie.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import { EditCompanyInputDto } from './dtos/edit-company.dto';

@Injectable()
export class EditCompany {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
  ) {}

  public async execute(id: string, data: EditCompanyInputDto): Promise<SuccessMessage> {
    const company = await this.companyDao.findById(id);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    if (data.document && data.document !== company.document) {
      const duplicate = await this.companyDao.findByDocument(data.document);
      if (duplicate) {
        throw new CompanyDuplicateDocumentError();
      }
    }
    if (data.ie && data.ie !== company.ie) {
      const duplicate = await this.companyDao.findByIe(data.ie);
      if (duplicate) {
        throw new CompanyDuplicateIeError();
      }
    }

    await this.companyDao.edit(id, data);

    return { message: 'Empresa atualizada com sucesso!' };
  }
}
