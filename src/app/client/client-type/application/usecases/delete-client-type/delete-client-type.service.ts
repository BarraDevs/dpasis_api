import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientTypeNotFoundError } from '../../../domain/errors/client-type-not-found.error';
import type { IClientTypeDao } from '../../persistence/dao/client-type-dao.interface';

@Injectable()
export class DeleteClientType {
  constructor(
    @Inject(TOKENS.ClientTypeDao) private readonly clientTypeDao: IClientTypeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientType = await this.clientTypeDao.findById(id);
    if (!clientType) {
      throw new ClientTypeNotFoundError();
    }

    await this.clientTypeDao.delete(id);

    return { message: 'Tipo de cliente excluído com sucesso' };
  }
}
