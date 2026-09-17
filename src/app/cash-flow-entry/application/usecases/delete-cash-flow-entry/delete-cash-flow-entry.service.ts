import { Inject, Injectable } from '@nestjs/common';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';

@Injectable()
export class DeleteCashFlowEntry {
  constructor(
    @Inject(TOKENS.CashFlowEntryDao) private readonly dao: ICashFlowEntryDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const entry = await this.dao.findById(id);
    if (!entry) {
      throw new CashFlowEntryNotFoundError();
    }

    await this.dao.delete(id);

    return { message: 'Lançamento de fluxo de caixa excluído com sucesso' };
  }
}
