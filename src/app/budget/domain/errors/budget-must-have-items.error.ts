import { BadRequestException } from '@nestjs/common';

export class BudgetMustHaveItemsError extends BadRequestException {
  constructor() {
    super('O orçamento deve possuir ao menos um item.');
  }
}
