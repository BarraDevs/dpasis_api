import { Inject, Injectable } from '@nestjs/common';
import type { IBudgetRepository } from 'src/app/budget/application/persistence/repository/budget-repository.interface';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { Order } from 'src/app/order/domain/entities/order.entity';
import { BudgetAlreadyHasOrderError } from 'src/app/order/domain/errors/budget-already-has-order.error';
import { BudgetNotApprovedError } from 'src/app/order/domain/errors/budget-not-approved.error';
import { TOKENS } from 'src/core/di/token';
import type { IOrderRepository } from '../../persistence/repository/order-repository.interface';
import { CreateOrderFromBudgetInputDto, CreateOrderFromBudgetOutputDto } from './dtos/create-order-from-budget.dto';

@Injectable()
export class CreateOrderFromBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepository: IBudgetRepository,
    @Inject(TOKENS.OrderRepository) private readonly orderRepository: IOrderRepository,
  ) {}

  public async execute(data: CreateOrderFromBudgetInputDto): Promise<CreateOrderFromBudgetOutputDto> {
    const budget = await this.budgetRepository.findById(data.budgetId);
    if (!budget) {
      throw new BudgetNotFoundError();
    }
    if (!budget.isApproved()) {
      throw new BudgetNotApprovedError();
    }

    const existingOrder = await this.orderRepository.findByBudgetId(data.budgetId);
    if (existingOrder) {
      throw new BudgetAlreadyHasOrderError();
    }

    const order = Order.create({
      budgetId: data.budgetId,
      createdBy: data.accountId,
    });

    await this.orderRepository.save(order);

    return {
      orderId: order.props.id,
      budgetId: order.props.budgetId,
      createdAt: order.props.createdAt,
    };
  }
}
