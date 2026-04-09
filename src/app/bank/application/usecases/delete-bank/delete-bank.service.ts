import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { BankInUseError } from '../../../domain/errors/bank-in-use.error';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';

@Injectable()
export class DeleteBank {
  constructor(
    @Inject(TOKENS.BankDao) private readonly bankDao: IBankDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.bankDao.findById(id);
    if (!existing) {
      throw new BankNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.bankDao.countClientInvoiceConfigsByBankId(id),
    ]);
    if (inUse) {
      throw new BankInUseError();
    }

    await this.bankDao.delete(id);
    return { message: 'Banco excluído com sucesso.' };
  }
}
