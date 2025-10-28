import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ContactDto } from '../../dtos/contact.dto';
import type { IContactDao } from '../../persistence/dao/contact-dao.interface';
import { FindAllContactQueryDto } from './dtos/find-all-contact.dto';

@Injectable()
export class FindAllContact {
  constructor(
    @Inject(TOKENS.ContactDao) private readonly contactDao: IContactDao
  ) {}

  public async execute(queries: FindAllContactQueryDto): Promise<IPagination<ContactDto>> {
    const [result, total] = await this.contactDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
