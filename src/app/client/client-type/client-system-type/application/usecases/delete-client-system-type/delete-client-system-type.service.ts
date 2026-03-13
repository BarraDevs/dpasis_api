import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';

@Injectable()
export class DeleteClientSystemType {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientSystemType = await this.clientSystemTypeDao.findById(id);
    if (!clientSystemType) {
      throw new ClientSystemTypeNotFoundError();
    }

    await this.clientSystemTypeDao.delete(id);

    return { message: 'Tipo de sistema de cliente excluído com sucesso' };
  }
}
