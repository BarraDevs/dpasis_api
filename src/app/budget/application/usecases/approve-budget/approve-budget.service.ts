import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { StockValidator } from 'src/app/budget/domain/services/stock-validator/stock-validator.service';
import type { IProductRepository } from 'src/app/product/application/persistence/repository/product-repository.interface';
import type { IServiceRepository } from 'src/app/service/application/persistence/repository/service-repository.interface';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';

@Injectable()
export class ApproveBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepository: IBudgetRepository,
    @Inject(TOKENS.ProductRepository) private readonly productRepository: IProductRepository,
    @Inject(TOKENS.ServiceRepository) private readonly serviceRepository: IServiceRepository,
    private readonly stockValidator: StockValidator,
  ) {}

  public async execute(id: string, accountId: string): Promise<SuccessMessage> {
    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new BudgetNotFoundError();
    }

    // check if products have stock and services are active
    await this.stockValidator.validate(
      budget.items.map((item) => ({
        itemType: item.props.itemType,
        productId: item.props.productId ?? null,
        serviceId: item.props.serviceId ?? null,
        quantity: item.props.quantity,
      })),
      this.productRepository,
      this.serviceRepository,
    );

    budget.approve(accountId);

    await this.budgetRepository.edit(budget);

    return { message: 'Orçamento aprovado com sucesso!' };
  }
}
