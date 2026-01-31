import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { BudgetDto } from '../../dtos/budget.dto';

export type FindAllBudgetQueroDto = {
  page?: number;
  limit?: number;
  companyId?: string;
  clientId?: string;
  sellerId?: string;
  shipperId?: string;
  freightType?: string;
  status?: BudgetStatus;
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export interface IBudgetDao {
  findAll(filters: FindAllBudgetQueroDto): Promise<[BudgetDto[], number]>;
  findById(id: string): Promise<BudgetDto | null>;
}
