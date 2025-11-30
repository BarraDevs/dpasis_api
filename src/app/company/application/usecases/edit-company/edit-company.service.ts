import { Inject, Injectable } from '@nestjs/common';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { CompanyDuplicateIeError } from 'src/app/company/domain/errors/duplicate-ie.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import type { ICompanyRepository } from '../../persistence/repository/company-repository.interface';
import { EditCompanyInputDto } from './dtos/edit-company.dto';

@Injectable()
export class EditCompany {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
    @Inject(TOKENS.CompanyRepository) private readonly companyRepository: ICompanyRepository,
  ) {}

  public async execute(id: string, data: EditCompanyInputDto): Promise<SuccessMessage> {
    const companyData = await this.companyDao.findById(id);
    if (!companyData) {
      throw new CompanyNotFoundError();
    }

    if (data.document && data.document !== companyData.document) {
      const duplicate = await this.companyDao.findByDocument(data.document);
      if (duplicate) {
        throw new CompanyDuplicateDocumentError();
      }
    }
    if (data.ie && data.ie !== companyData.ie) {
      const duplicate = await this.companyDao.findByIe(data.ie);
      if (duplicate) {
        throw new CompanyDuplicateIeError();
      }
    }

    const company = Company.load({ ...companyData, ...data });
    await this.companyRepository.edit(company);

    return { message: 'Empresa atualizada com sucesso!' };
  }
}
