import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { ClientDuplicateIeError } from 'src/app/client/domain/errors/duplicate-ie.error';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
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
    const duplicateCnpj = await this.clientDao.findByCnpj(data.cnpj);
    if (duplicateCnpj) {
      throw new ClientDuplicateCnpjError();
    }

    const duplicateIe = await this.clientDao.findByIe(data.ie);
    if (duplicateIe) {
      throw new ClientDuplicateIeError();
    }

    // Verify if each company exists
    await Promise.all(
      data.companyIds.map(
        async(companyId) => this.findCompanyById.execute(companyId),
      ),
    );

    const client = Client.create(data);
    await this.clientRepository.save(client);

    return { id: client.props.id };
  }
}
