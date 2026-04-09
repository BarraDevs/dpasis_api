import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { EditBankInputDto } from './dtos/edit-bank.dto';

@Injectable()
export class EditBank {
  constructor(
    @Inject(TOKENS.BankDao) private readonly bankDao: IBankDao,
  ) {}

  public async execute(id: number, data: EditBankInputDto): Promise<SuccessMessage> {
    const bank = await this.bankDao.findById(id);
    if (!bank) {
      throw new BankNotFoundError();
    }

    const existing = await this.bankDao.findByBankCodeAgencyAccount(
      data.bankCode,
      data.agency,
      data.account,
    );
    if (existing && existing.id !== id) {
      throw new BankAlreadyExistsError(
        data.bankCode,
        data.agency,
        data.account,
      );
    }

    await this.bankDao.edit(id, data);

    return { message: 'Banco atualizado com sucesso' };
  }
}
