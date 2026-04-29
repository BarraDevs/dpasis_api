import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ResaleContactNotFoundError } from '../../../domain/errors/resale-contact-not-found.error';
import { ResaleContactDto } from '../../dtos/resale-contact.dto';
import type { IResaleContactDao } from '../../persistence/dao/resale-contact-dao.interface';

@Injectable()
export class FindResaleContactById {
  constructor(
    @Inject(TOKENS.ResaleContactDao) private readonly resaleContactDao: IResaleContactDao,
  ) {}

  public async execute(id: number): Promise<ResaleContactDto> {
    const resaleContact = await this.resaleContactDao.findById(id);
    if (!resaleContact) {
      throw new ResaleContactNotFoundError();
    }

    return resaleContact;
  }
}
