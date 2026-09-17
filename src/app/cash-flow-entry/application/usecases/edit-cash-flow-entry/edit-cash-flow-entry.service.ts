import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { CashFlowEntryEditData, ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { EditCashFlowEntryInputDto } from './dtos/edit-cash-flow-entry.dto';

@Injectable()
export class EditCashFlowEntry {
  constructor(
    @Inject(TOKENS.CashFlowEntryDao) private readonly dao: ICashFlowEntryDao,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(id: number, data: EditCashFlowEntryInputDto): Promise<SuccessMessage> {
    const entry = await this.dao.findById(id);
    if (!entry) {
      throw new CashFlowEntryNotFoundError();
    }

    if (data.companyId != null) {
      await this.findCompanyById.execute(data.companyId, { onlyActive: true });
    }

    const patch: CashFlowEntryEditData = {};
    if (data.companyId != null) {
      patch.companyId = data.companyId;
    }
    if (data.type != null) {
      patch.type = data.type;
    }
    if (data.amountInCents != null) {
      patch.amountInCents = data.amountInCents;
    }
    if (data.occurredAt != null) {
      patch.occurredAt = new Date(data.occurredAt);
    }
    if (data.description != null) {
      patch.description = data.description;
    }

    await this.dao.edit(id, patch);

    return { message: 'Lançamento de fluxo de caixa atualizado com sucesso' };
  }
}
