import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';

@Injectable()
export class DeleteClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const client = await this.clientDao.findById(id);
    if (!client) {
      throw new ClientNotFoundError();
    }

    await this.clientRepository.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
