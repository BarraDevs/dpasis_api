import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { TOKENS } from 'src/core/di/token';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { CreateClientInputDto, CreateClientOutputDto } from './dtos/create-client.dto';

@Injectable()
export class CreateClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateClientInputDto): Promise<CreateClientOutputDto> {
    const client = Client.create(data);

    const duplicateCnpj = await this.clientDao.findByCnpj(client.props.cnpj);
    if (duplicateCnpj) {
      throw new ClientDuplicateCnpjError();
    }

    // Verify if each company exists
    const companies = await Promise.all(
      client.props.companyIds.map(
        async(companyId) => this.findCompanyById.execute(companyId),
      ),
    );
    companies.forEach((company) => {
      if (!company.active) {
        throw new CompanyNotActiveError(company.fantasyName);
      }
    });

    await this.clientRepository.save(client);

    return { id: client.props.id };
  }
}
