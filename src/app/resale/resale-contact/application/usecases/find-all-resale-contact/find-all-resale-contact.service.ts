import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ResaleContactDto } from '../../dtos/resale-contact.dto';
import type { IResaleContactDao } from '../../persistence/dao/resale-contact-dao.interface';
import { FindAllResaleContactQueryDto } from './dtos/find-all-resale-contact.dto';

@Injectable()
export class FindAllResaleContact {
  constructor(
    @Inject(TOKENS.ResaleContactDao) private readonly resaleContactDao: IResaleContactDao,
  ) {}

  public async execute(queries: FindAllResaleContactQueryDto): Promise<IPagination<ResaleContactDto>> {
    const [result, total] = await this.resaleContactDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
