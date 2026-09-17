import { Inject, Injectable } from '@nestjs/common';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';

@Injectable()
export class FindCashFlowEntryById {
  constructor(
    @Inject(TOKENS.CashFlowEntryDao) private readonly dao: ICashFlowEntryDao,
  ) {}

  public async execute(id: number): Promise<CashFlowEntryDto> {
    const entry = await this.dao.findById(id);
    if (!entry) {
      throw new CashFlowEntryNotFoundError();
    }

    return entry;
  }
}
