import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { BudgetDto } from '../../dtos/budget.dto';
import type { IBudgetDao } from '../../persistence/dao/budget-dao.interface';
import { FindAllBudgetQueryDto } from './dtos/find-all-budget.dto';

@Injectable()
export class FindAllBudget {
  constructor(
    @Inject(TOKENS.BudgetDao) private budgetDao: IBudgetDao,
  ) {}

  public async execute(queries: FindAllBudgetQueryDto): Promise<IPagination<BudgetDto>> {
    const [result, total] = await this.budgetDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
