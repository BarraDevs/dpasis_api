import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { FindProductById } from 'src/app/product/application/usecases/find-product-by-id/find-product-by-id.service';
import { ProductOutOfStockError } from 'src/app/product/domain/errors/product-out-of-stock.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';

@Injectable()
export class ApproveBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepo: IBudgetRepository,
    private readonly findProductById: FindProductById,
  ) {}

  public async execute(id: string, accountId: string): Promise<SuccessMessage> {
    const budget = await this.budgetRepo.findById(id);
    if (!budget) {
      throw new BudgetNotFoundError();
    }

    for (const item of budget.items) {
      if (item.props.itemType === BudgetItemType.PRODUCT && item.props.productId) {
        const product = await this.findProductById.execute(item.props.productId);
        if (product.currentStock < item.props.quantity) {
          throw new ProductOutOfStockError(product.description);
        }
      }
    }

    budget.approve(accountId);

    await this.budgetRepo.edit(budget);

    return { message: 'Orçamento aprovado com sucesso!' };
  }
}
