import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found.error';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { EditClientInputDto } from './dtos/edit-client.dto';

@Injectable()
export class EditClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(id: string, data: EditClientInputDto): Promise<SuccessMessage> {
    const clientData = await this.clientDao.findById(id);
    if (!clientData) {
      throw new ClientNotFoundError();
    }

    const { companies, ...rest } = clientData;

    const client = Client.load({
      ...rest,
      ...data,
      companyIds: data.companyIds ?? companies.map((company) => company.id),
    });

    if (data.cnpj && client.props.cnpj !== clientData.cnpj) {
      const existingClientWithCnpj = await this.clientDao.findByCnpj(data.cnpj);
      if (existingClientWithCnpj) {
        throw new ClientDuplicateCnpjError();
      }
    }

    if (data.companyIds) {
      await Promise.all(
        client.props.companyIds.map(
          async(companyId) => await this.findCompanyById.execute(companyId),
        ),
      );
    }

    await this.clientRepository.edit(client);

    return { message: 'Cliente editado com sucesso!' };
  }
}
