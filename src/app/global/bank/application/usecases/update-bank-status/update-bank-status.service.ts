import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';

@Injectable()
export class UpdateBankStatus {
  constructor(
    @Inject(TOKENS.BankDao) private readonly bankDao: IBankDao,
  ) {}

  public async execute(id: number): Promise<{ message: string }> {
    const bank = await this.bankDao.findById(id);
    if (!bank) {
      throw new BankNotFoundError();
    }

    await this.bankDao.updateStatus(id, !bank.active);

    return { message: 'Status do banco atualizado com sucesso' };
  }
}
