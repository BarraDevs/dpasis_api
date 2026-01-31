import { Budget } from 'src/app/budget/domain/entities/budget.entity';

export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  save(budget: Budget): Promise<void>;
  edit(budget: Budget): Promise<void>;
  delete(id: string): Promise<void>;
}
