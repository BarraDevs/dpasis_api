import { Inject, Injectable } from '@nestjs/common';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CompanyFactory } from 'src/app/company/domain/factories/company.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import type { ICompanyRepository } from '../../persistence/repository/company-repository.interface';
import { EditCompanyInputDto } from './dtos/edit-company.dto';

@Injectable()
export class EditCompany {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
    @Inject(TOKENS.CompanyRepository) private readonly companyRepository: ICompanyRepository,
  ) {}

  public async execute(id: number, data: EditCompanyInputDto): Promise<SuccessMessage> {
    const company = await this.companyDao.findById(id);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    const companyEntity = CompanyFactory.edit({
      ...company,
      ...data,
      id,
      active: company.active,
    });

    if (data.document) {
      const documentAlreadyTaken = await this.companyDao.findByDocument(
        companyEntity.props.document,
      );
      if (documentAlreadyTaken && documentAlreadyTaken.id !== id) {
        throw new DocumentAlreadyTakenError(companyEntity.props.document);
      }
    }

    await this.companyRepository.edit(companyEntity);

    return { message: 'Edição realizada com sucesso' };
  }
}
