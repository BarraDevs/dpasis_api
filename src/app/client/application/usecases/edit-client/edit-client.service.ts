import { Inject, Injectable } from '@nestjs/common';
import { FindClientGroupById } from 'src/app/client-group/application/usecases/find-client-group-by-id/find-client-group-by-id.service';
import { FindClientOwnerById } from 'src/app/client-owner/application/usecases/find-client-owner-by-id/find-client-owner-by-id.service';
import { ClientInvoiceType } from 'src/app/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/domain/enums/client-type.enum';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import { ClientFactory } from '../../../domain/factories/client.factory';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { EditClientInputDto } from './dtos/edit-client.dto';

@Injectable()
export class EditClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
    private readonly findClientGroupById: FindClientGroupById,
    private readonly findClientOwnerById: FindClientOwnerById,
  ) {}

  public async execute(id: number, data: EditClientInputDto): Promise<SuccessMessage> {
    const client = await this.clientDao.findById(id);
    if (!client) {
      throw new ClientNotFoundError();
    }

    const clientEntity = ClientFactory.edit({
      ...client,
      ...data,
      id,
      type: client.type as ClientType,
      invoiceType: client.invoiceType as ClientInvoiceType,
    });

    if (data.document) {
      const documentAlreadyTaken = await this.clientDao.findByDocument(data.document);
      if (documentAlreadyTaken && documentAlreadyTaken.id !== id) {
        throw new DocumentAlreadyTakenError(data.document);
      }
    }
    if (data.groupId) {
      await this.findClientGroupById.execute(data.groupId);
    }
    if (data.ownerId) {
      await this.findClientOwnerById.execute(data.ownerId!);
    }

    await this.clientRepository.edit(clientEntity);

    return { message: 'Edição realizada com sucesso' };
  }
}
