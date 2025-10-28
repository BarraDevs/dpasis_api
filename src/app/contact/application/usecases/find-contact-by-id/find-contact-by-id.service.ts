import { Inject, Injectable } from '@nestjs/common';
import { ContactNotFoundError } from 'src/app/contact/domain/errors/contact-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ContactDto } from '../../dtos/contact.dto';
import type { IContactDao } from '../../persistence/dao/contact-dao.interface';

@Injectable()
export class FindContactById {
  constructor(
    @Inject(TOKENS.ContactDao) private readonly contactDao: IContactDao,
  ) {}

  public async execute(id: string): Promise<ContactDto> {
    const contact = await this.contactDao.findById(id);
    if (!contact) {
      throw new ContactNotFoundError();
    }

    return contact;
  }
}
