import { Inject, Injectable } from '@nestjs/common';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
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

    const company = Company.load({
      ...companyData,
      ...data,
      updatedAt: UTCDate.create().value,
    });

    if (data.document && company.props.document !== companyData.document) {
      const duplicate = await this.companyDao.findByDocument(company.props.document);
      if (duplicate) {
        throw new CompanyDuplicateDocumentError();
      }
    }

    await this.companyRepository.edit(company);

    return { message: 'Empresa atualizada com sucesso!' };
  }
}
