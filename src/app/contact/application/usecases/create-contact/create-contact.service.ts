import { Inject, Injectable } from '@nestjs/common';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { OwnerNotActiveError } from 'src/app/owner/domain/errors/owner-not-active.error';
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
    const owner = await this.findOwnerById.execute(data.ownerId);
    if (!owner.active) {
      throw new OwnerNotActiveError();
    }

    const contactId = await this.contactDao.save({ ...data, ownerId: owner.id });

    return { id: contactId };
  }
}
