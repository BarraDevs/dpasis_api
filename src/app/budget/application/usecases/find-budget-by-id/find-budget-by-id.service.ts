import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { BudgetDto } from '../../dtos/budget.dto';
import type { IBudgetDao } from '../../persistence/dao/budget-dao.interface';

@Injectable()
export class FindBudgetById {
  constructor(
    @Inject(TOKENS.BudgetDao) private readonly budgetDao: IBudgetDao,
  ) {}

  public async execute(id: string): Promise<BudgetDto> {
    const budget = await this.budgetDao.findById(id);
    if (!budget) {
      throw new BudgetNotFoundError();
    }

    return budget;
  }
}
