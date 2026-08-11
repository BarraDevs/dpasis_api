import { Inject, Injectable } from '@nestjs/common';
import { CompanyFactory } from 'src/app/company/company/domain/factories/company.factory';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import type { ICompanyRepository } from '../../persistence/repository/company-repository.interface';
import { CreateCompanyInputDto, CreateCompanyOutputDto } from './dtos/create-company.dto';

@Injectable()
export class CreateCompany {
  constructor(
    @Inject(TOKENS.CompanyDao) private readonly companyDao: ICompanyDao,
    @Inject(TOKENS.CompanyRepository) private readonly companyRepository: ICompanyRepository,
  ) {}

  public async execute(data: CreateCompanyInputDto): Promise<CreateCompanyOutputDto> {
    const entity = CompanyFactory.create(data);

    const documentAlreadyTaken = await this.companyDao.findByDocument(entity.props.document);
    if (documentAlreadyTaken) {
      throw new DocumentAlreadyTakenError(entity.props.document);
    }

    const id = await this.companyRepository.save(entity);

    return { id };
  }
}
