import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import type { IClientDescriptionTypeDao } from '../../persistence/dao/client-description-type-dao.interface';

@Injectable()
export class DeleteClientDescriptionType {
  constructor(
    @Inject(TOKENS.ClientDescriptionTypeDao) private readonly clientDescriptionTypeDao: IClientDescriptionTypeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientDescriptionType = await this.clientDescriptionTypeDao.findById(id);
    if (!clientDescriptionType) {
      throw new ClientDescriptionTypeNotFoundError();
    }

    await this.clientDescriptionTypeDao.delete(id);

    return { message: 'Tipo de descrição de cliente excluído com sucesso' };
  }
}
