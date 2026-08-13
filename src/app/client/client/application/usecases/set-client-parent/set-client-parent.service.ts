import { Inject, Injectable } from '@nestjs/common';
import { ClientCannotBeSelfParentError } from 'src/app/client/client/domain/errors/client-cannot-be-self-parent.error';
import { ClientHasSubClientsCannotSetParentError } from 'src/app/client/client/domain/errors/client-has-sub-clients-cannot-set-parent.error';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { ClientParentIsSubClientError } from 'src/app/client/client/domain/errors/client-parent-is-sub-client.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientFactory } from 'src/app/client/client/domain/factories/client.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { SetClientParentInputDto } from './dtos/set-client-parent.dto';

@Injectable()
export class SetClientParent {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
  ) {}

  public async execute(clientId: number, data: SetClientParentInputDto): Promise<SuccessMessage> {
    const client = await this.clientDao.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError();
    }

    const requestedParent = data.parentClientId ?? null;
    const currentParent = client.parentClientId ?? null;

    if (requestedParent === currentParent) {
      return { message: 'Nenhuma alteração no vínculo com o cliente titular foi necessária.' };
    }

    if (requestedParent !== null) {
      const subClientsCount = await this.clientDao.countSubClients(clientId);
      if (subClientsCount > 0) {
        throw new ClientHasSubClientsCannotSetParentError();
      }

      if (requestedParent === clientId) {
        throw new ClientCannotBeSelfParentError();
      }

      const parent = await this.clientDao.findById(requestedParent);
      if (!parent) {
        throw new ClientNotFoundError();
      }

      if (parent.isSubClient) {
        throw new ClientParentIsSubClientError();
      }
    }

    const entity = ClientFactory.edit({
      id: client.id,
      type: client.type as ClientType,
      document: client.document,
      ie: client.ie,
      groupId: client.group.id,
      resaleId: client.resale.id,
      parentClientId: requestedParent,
      isSubClient: requestedParent !== null,
      companyId: client.company.id,
      invoiceType: client.invoiceType as ClientInvoiceType,
      generateInvoice: client.generateInvoice,
      companyName: client.companyName,
      fantasyName: client.fantasyName,
      socialName: client.socialName,
      domain: client.domain,
      headquarters: client.headquarters,
      active: client.active,
      honorificId: client.honorific?.id ?? null,
    });

    await this.clientRepository.edit(entity);

    return { message: 'Vínculo com o cliente titular atualizado com sucesso.' };
  }
}
