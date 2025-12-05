import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Provider } from 'src/app/provider/domain/entities/provider.entity';
import { ProviderDuplicateCnpjError } from 'src/app/provider/domain/errors/duplicate-cnpj.error';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderDao } from '../../persistence/dao/provider-dao.interface';
import type { IProviderRepository } from '../../persistence/repository/provider-repository.interface';
import { EditProviderInputDto } from './dtos/edit-provider.dto';

@Injectable()
export class EditProvider {
  constructor(
    @Inject(TOKENS.ProviderDao) private readonly providerDao: IProviderDao,
    @Inject(TOKENS.ProviderRepository) private readonly providerRepository: IProviderRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(id: string, data: EditProviderInputDto): Promise<SuccessMessage> {
    const providerData = await this.providerDao.findById(id);
    if (!providerData) {
      throw new ProviderNotFoundError();
    }

    const { companies, ...rest } = providerData;

    const provider = Provider.load({
      ...rest,
      ...data,
      companyIds: data.companyIds ?? companies.map((company) => company.id),
    });

    if (data.cnpj && provider.props.cnpj !== providerData.cnpj) {
      const existingProviderWithCnpj = await this.providerDao.findByCnpj(provider.props.cnpj);
      if (existingProviderWithCnpj) {
        throw new ProviderDuplicateCnpjError();
      }
    }

    if (data.companyIds) {
      await Promise.all(
        provider.props.companyIds.map(
          async(companyId) => await this.findCompanyById.execute(companyId),
        ),
      );
    }

    await this.providerRepository.edit(provider);

    return { message: 'Prestador editado com sucesso!' };
  }
}
