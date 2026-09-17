import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { TOKENS } from 'src/core/di/token';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { CreateCashFlowEntryInputDto, CreateCashFlowEntryOutputDto } from './dtos/create-cash-flow-entry.dto';

@Injectable()
export class CreateCashFlowEntry {
  constructor(
    @Inject(TOKENS.CashFlowEntryDao) private readonly dao: ICashFlowEntryDao,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateCashFlowEntryInputDto): Promise<CreateCashFlowEntryOutputDto> {
    const company = await this.findCompanyById.execute(data.companyId, { onlyActive: true });

    const id = await this.dao.save({
      companyId: company.id,
      type: data.type,
      origin: CashFlowEntryOrigin.MANUAL,
      amountInCents: data.amountInCents,
      occurredAt: new Date(data.occurredAt),
      description: data.description,
    });

    return { id };
  }
}
