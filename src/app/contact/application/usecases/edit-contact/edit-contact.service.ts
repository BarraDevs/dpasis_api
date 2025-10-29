import { Inject, Injectable } from '@nestjs/common';
import { ContactNotFoundError } from 'src/app/contact/domain/errors/contact-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IContactDao } from '../../persistence/dao/contact-dao.interface';
import { EditContactInputDto } from './dtos/edit-contact.dto';

@Injectable()
export class EditContact {
  constructor(
    @Inject(TOKENS.ContactDao) private readonly contactDao: IContactDao
  ) {}

  public async execute(id: string, data: EditContactInputDto): Promise<SuccessMessage> {
    const contact = await this.contactDao.findById(id);
    if (!contact) {
      throw new ContactNotFoundError();
    }

    await this.contactDao.edit(contact.id, data);

    return { message: 'Contato atualizado com sucesso!' };
  }
}
