import { Inject, Injectable } from '@nestjs/common';
import { CreateClientAddress } from 'src/app/client/client-address/application/usecases/create-client-address/create-client-address.service';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { FindClientGroupById } from 'src/app/client/client-group/application/usecases/find-client-group-by-id/find-client-group-by-id.service';
import { FindClientOwnerById } from 'src/app/client/client-owner/application/usecases/find-client-owner-by-id/find-client-owner-by-id.service';
import { ClientCannotBeSelfParentError } from 'src/app/client/client/domain/errors/client-cannot-be-self-parent.error';
import { ClientIdAlreadyTakenError } from 'src/app/client/client/domain/errors/client-id-already-taken.error';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { ClientParentIsSubClientError } from 'src/app/client/client/domain/errors/client-parent-is-sub-client.error';
import { ClientFactory } from 'src/app/client/client/domain/factories/client.factory';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { Document as DocumentVo } from 'src/shared/value-objects/document/document.vo';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import type { IClientSequenceRepository } from '../../persistence/repository/client-sequence-repository.interface';
import { CreateClientInputDto, CreateClientOutputDto } from './dtos/create-client.dto';

@Injectable()
export class CreateClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
    @Inject(TOKENS.ClientSequenceRepository) private readonly clientSequenceRepository: IClientSequenceRepository,
    private readonly createClientAddress: CreateClientAddress,
    private readonly findClientGroupById: FindClientGroupById,
    private readonly findClientOwnerById: FindClientOwnerById,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateClientInputDto): Promise<CreateClientOutputDto> {
    // Valida ID explícito antes de qualquer outra coisa
    if (data.id != null) {
      const idAlreadyTaken = await this.clientDao.findById(data.id);
      if (idAlreadyTaken) {
        throw new ClientIdAlreadyTakenError(data.id);
      }
    }

    // Valida cliente pai antes de consumir a sequence
    if (data.parentClientId != null) {
      if (data.parentClientId === data.id) {
        throw new ClientCannotBeSelfParentError();
      }

      const parent = await this.clientDao.findById(data.parentClientId);
      if (!parent) {
        throw new ClientNotFoundError();
      }
      if (parent.isSubClient) {
        throw new ClientParentIsSubClientError();
      }
    }

    // Verifica se o documento já está em uso
    const normalizedDocument = new DocumentVo(data.document).value;
    const documentAlreadyTaken = await this.clientDao.findByDocument(normalizedDocument);
    if (documentAlreadyTaken) {
      throw new DocumentAlreadyTakenError(normalizedDocument);
    }

    // Verifica se o grupo e o proprietário existem E estão ativos
    // Lança um erro se não existirem ou estão inativos
    await this.findClientGroupById.execute(data.groupId, { onlyActive: true });
    await this.findClientOwnerById.execute(data.ownerId, { onlyActive: true });

    // Verifica se todas as empresas existem e estão ativas
    for (const companyId of data.companyIds) {
      await this.findCompanyById.execute(companyId, { onlyActive: true });
    }

    // Todas as validações passaram — agora consome/reserva o ID
    let clientId: number;
    if (data.id != null) {
      clientId = data.id;
      await this.clientSequenceRepository.ensureNextIdIsAtLeast(clientId + 1);
    }
    else {
      clientId = await this.clientSequenceRepository.getAndIncrement();
    }

    const entity = ClientFactory.create({
      id: clientId,
      type: data.type,
      document: data.document,
      ie: data.ie,
      groupId: data.groupId,
      ownerId: data.ownerId,
      parentClientId: data.parentClientId ?? null,
      companyIds: data.companyIds,
      invoiceType: data.invoiceType,
      generateInvoice: data.generateInvoice,
      companyName: data.companyName,
      fantasyName: data.fantasyName,
      headquarters: data.headquarters,
    });

    // saga step 1: create client
    const id = await this.clientRepository.save(entity);

    // saga step 2: create client address
    try {
      await this.createClientAddress.execute({
        clientId: id,
        type: ClientAddressType.MAIN,
        zipCode: data.address.zipCode,
        street: data.address.street,
        number: data.address.number,
        complement: data.address.complement,
        neighborhood: data.address.neighborhood,
        city: data.address.city,
        state: data.address.state,
      });
    }
    catch (error) {
      // rollback step 1: delete client
      await this.clientRepository.delete(id);
      throw error;
    }

    return { id };
  }
}
