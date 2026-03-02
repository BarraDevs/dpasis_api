import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import type { IClientContactDao } from '../../persistence/dao/client-contact-dao.interface';

@Injectable()
export class DeleteClientContact {
  constructor(
    @Inject(TOKENS.ClientContactDao) private readonly clientContactDao: IClientContactDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientContact = await this.clientContactDao.findById(id);
    if (!clientContact) {
      throw new ClientContactNotFoundError();
    }

    await this.clientContactDao.delete(id);

    return { message: 'Contato de cliente excluído com sucesso' };
  }
}
