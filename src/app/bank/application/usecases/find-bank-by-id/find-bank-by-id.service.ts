import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { BankDto } from '../../dtos/bank.dto';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';

@Injectable()
export class FindBankById {
  constructor(
    @Inject(TOKENS.BankDao) private readonly bankDao: IBankDao,
  ) {}

  public async execute(id: number, onlyActive: boolean = false): Promise<BankDto> {
    const bank = await this.bankDao.findById(id);
    if (!bank) {
      throw new BankNotFoundError();
    }
    if (onlyActive && !bank.active) {
      throw new BankNotFoundError();
    }

    return bank;
  }
}
