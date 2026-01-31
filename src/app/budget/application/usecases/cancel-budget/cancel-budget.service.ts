import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';

@Injectable()
export class CancelBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepo: IBudgetRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const budget = await this.budgetRepo.findById(id);
    if (!budget) {
      throw new BudgetNotFoundError();
    }

    budget.cancel();

    await this.budgetRepo.edit(budget);

    return { message: 'Orçamento cancelado com sucesso!' };
  }
}
