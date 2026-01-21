import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { Provider } from 'src/app/provider/domain/entities/provider.entity';
import { ProviderDuplicateCnpjError } from 'src/app/provider/domain/errors/duplicate-cnpj.error';
import { TOKENS } from 'src/core/di/token';
import type { IProviderDao } from '../../persistence/dao/provider-dao.interface';
import type { IProviderRepository } from '../../persistence/repository/provider-repository.interface';
import { CreateProviderInputDto, CreateProviderOutputDto } from './dtos/create-provider.dto';

@Injectable()
export class CreateProvider {
  constructor(
    @Inject(TOKENS.ProviderDao) private readonly providerDao: IProviderDao,
    @Inject(TOKENS.ProviderRepository) private readonly providerRepository: IProviderRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateProviderInputDto): Promise<CreateProviderOutputDto> {
    const provider = Provider.create(data);

    const duplicateCnpj = await this.providerDao.findByCnpj(provider.props.cnpj);
    if (duplicateCnpj) {
      throw new ProviderDuplicateCnpjError();
    }

    // Verify if each company exists
    const companies = await Promise.all(
      provider.props.companyIds.map(
        async(companyId) => this.findCompanyById.execute(companyId),
      ),
    );
    companies.forEach((company) => {
      if (!company.active) {
        throw new CompanyNotActiveError(company.fantasyName);
      }
    });

    await this.providerRepository.save(provider);

    return { id: provider.props.id };
  }
}
