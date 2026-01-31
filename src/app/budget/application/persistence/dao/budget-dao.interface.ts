import { BudgetDto } from '../../dtos/budget.dto';
import { FindAllBudgetQueryDto } from '../../usecases/find-all-budget/dtos/find-all-budget.dto';

export interface IBudgetDao {
  findAll(queries: FindAllBudgetQueryDto): Promise<[BudgetDto[], number]>;
  findById(id: string): Promise<BudgetDto | null>;
}
