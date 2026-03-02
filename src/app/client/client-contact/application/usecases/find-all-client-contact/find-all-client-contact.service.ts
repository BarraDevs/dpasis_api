import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientContactDto } from '../../dtos/client-contact.dto';
import type { IClientContactDao } from '../../persistence/dao/client-contact-dao.interface';
import { FindAllClientContactQueryDto } from './dtos/find-all-client-contact.dto';

@Injectable()
export class FindAllClientContact {
  constructor(
    @Inject(TOKENS.ClientContactDao) private readonly clientContactDao: IClientContactDao,
  ) {}

  public async execute(queries: FindAllClientContactQueryDto): Promise<IPagination<ClientContactDto>> {
    const [result, total] = await this.clientContactDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
