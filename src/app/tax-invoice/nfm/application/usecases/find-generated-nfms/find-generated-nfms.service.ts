import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { NfmWithNfseDto } from '../../dtos/nfm.dto';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';
import { InvalidNfmDateRangeError } from '../../../domain/errors/invalid-nfm-date-range.error';
import { FindGeneratedNfmsQueryDto } from './dtos/find-generated-nfms.dto';

@Injectable()
export class FindGeneratedNfms {
  constructor(
    @Inject(TOKENS.NfmDao) private readonly nfmDao: INfmDao,
  ) {}

  public async execute(queries: FindGeneratedNfmsQueryDto): Promise<IPagination<NfmWithNfseDto>> {
    if (
      queries.dateStart !== undefined
      && queries.dateEnd !== undefined
      && queries.dateStart > queries.dateEnd
    ) {
      throw new InvalidNfmDateRangeError();
    }

    const [rows, total] = await this.nfmDao.findAll(queries);
    return new Pagination(rows, total, queries.page, queries.size).getDto();
  }
}
