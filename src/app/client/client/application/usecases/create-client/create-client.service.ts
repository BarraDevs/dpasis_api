import { Inject, Injectable } from '@nestjs/common';
import { FindClientGroupById } from 'src/app/client/client-group/application/usecases/find-client-group-by-id/find-client-group-by-id.service';
import { FindClientOwnerById } from 'src/app/client/client-owner/application/usecases/find-client-owner-by-id/find-client-owner-by-id.service';
import { ClientFactory } from 'src/app/client/client/domain/factories/client.factory';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { CreateClientInputDto, CreateClientOutputDto } from './dtos/create-client.dto';

@Injectable()
export class CreateClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
    private readonly findClientGroupById: FindClientGroupById,
    private readonly findClientOwnerById: FindClientOwnerById,
  ) {}

  public async execute(data: CreateClientInputDto): Promise<CreateClientOutputDto> {
    const entity = ClientFactory.create(data);

    const documentAlreadyTaken = await this.clientDao.findByDocument(entity.props.document);
    if (documentAlreadyTaken) {
      throw new DocumentAlreadyTakenError(entity.props.document);
    }

    // Verifica se o grupo e o proprietário existem
    // Se não existirem, lança um erro
    await this.findClientGroupById.execute(data.groupId);
    await this.findClientOwnerById.execute(data.ownerId);

    await this.clientRepository.save(entity);

    return { id: entity.props.id };
  }
}
