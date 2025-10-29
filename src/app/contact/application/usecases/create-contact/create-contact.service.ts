import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IContactDao } from '../../persistence/dao/contact-dao.interface';
import { CreateContactInputDto, CreateContactOutputDto } from './dtos/create-contact.dto';

@Injectable()
export class CreateContact {
  constructor(
    @Inject(TOKENS.ContactDao) private readonly contactDao: IContactDao,
  ) {}

  public async execute(data: CreateContactInputDto): Promise<CreateContactOutputDto> {
    const contactId = await this.contactDao.save(data);

    return { id: contactId };
  }
}
