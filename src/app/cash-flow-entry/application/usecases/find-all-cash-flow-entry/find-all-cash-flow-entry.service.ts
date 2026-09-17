import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { FindAllCashFlowEntryQueryDto } from './dtos/find-all-cash-flow-entry.dto';

@Injectable()
export class FindAllCashFlowEntry {
  constructor(
    @Inject(TOKENS.CashFlowEntryDao) private readonly dao: ICashFlowEntryDao,
  ) {}

  public async execute(queries: FindAllCashFlowEntryQueryDto): Promise<IPagination<CashFlowEntryDto>> {
    const [result, total] = await this.dao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
