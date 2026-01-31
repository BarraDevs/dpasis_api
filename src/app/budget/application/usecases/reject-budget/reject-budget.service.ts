import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';
import { RejectBudgetInputDto } from './dtos/reject-budget.dto';

@Injectable()
export class RejectBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepo: IBudgetRepository,
  ) {}

  public async execute(id: string, data: RejectBudgetInputDto): Promise<SuccessMessage> {
    const budget = await this.budgetRepo.findById(id);
    if (!budget) {
      throw new BudgetNotFoundError();
    }

    budget.reject(data.accountId, data.reason);

    await this.budgetRepo.edit(budget);

    return { message: 'Orçamento rejeitado com sucesso!' };
  }
}
