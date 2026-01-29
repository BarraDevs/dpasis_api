import { NotFoundException } from '@nestjs/common';

export class BudgetNotFoundError extends NotFoundException {
  constructor() {
    super('Orçamento não encontrado na base de dados.');
  }
}
