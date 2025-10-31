import { Inject, Injectable } from '@nestjs/common';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IContactDao } from '../../persistence/dao/contact-dao.interface';
import { CreateContactInputDto, CreateContactOutputDto } from './dtos/create-contact.dto';

@Injectable()
export class CreateContact {
  constructor(
    @Inject(TOKENS.ContactDao) private readonly contactDao: IContactDao,
    private readonly findOwnerById: FindOwnerById,
  ) {}

  public async execute(data: CreateContactInputDto): Promise<CreateContactOutputDto> {
    // Ensure owner exists
    const owner = await this.findOwnerById.execute(data.ownerId);

    const contactId = await this.contactDao.save({ ...data, ownerId: owner.id });

    return { id: contactId };
  }
}
