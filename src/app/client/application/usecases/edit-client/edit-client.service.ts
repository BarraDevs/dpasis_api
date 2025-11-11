import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { ClientDuplicateIeError } from 'src/app/client/domain/errors/duplicate-ie.error';
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

    if (data.cnpj && data.cnpj !== clientData.cnpj) {
      const existingClientWithCnpj = await this.clientDao.findByCnpj(data.cnpj);
      if (existingClientWithCnpj) {
        throw new ClientDuplicateCnpjError();
      }
    }

    if (data.ie && data.ie !== clientData.ie) {
      const existingClientWithIe = await this.clientDao.findByIe(data.ie);
      if (existingClientWithIe) {
        throw new ClientDuplicateIeError();
      }
    }

    if (data.companyId && data.companyId !== clientData.companyId) {
      // Verify if the new company exists
      await this.findCompanyById.execute(data.companyId);
    }

    const client = Client.load({
      ...clientData,
      ...data,
    });

    await this.clientRepository.edit(client);

    return { message: 'Cliente editado com sucesso!' };
  }
}
