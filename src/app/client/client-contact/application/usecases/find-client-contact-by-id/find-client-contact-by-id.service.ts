import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import { ClientContactDto } from '../../dtos/client-contact.dto';
import type { IClientContactDao } from '../../persistence/dao/client-contact-dao.interface';

@Injectable()
export class FindClientContactById {
  constructor(
    @Inject(TOKENS.ClientContactDao) private readonly clientContactDao: IClientContactDao,
  ) {}

  public async execute(id: number): Promise<ClientContactDto> {
    const clientContact = await this.clientContactDao.findById(id);
    if (!clientContact) {
      throw new ClientContactNotFoundError();
    }

    return clientContact;
  }
}
