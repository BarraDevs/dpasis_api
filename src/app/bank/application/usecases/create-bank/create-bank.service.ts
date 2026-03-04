import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { CreateBankInputDto, CreateBankOutputDto } from './dtos/create-bank.dto';

@Injectable()
export class CreateBank {
  constructor(
    @Inject(TOKENS.BankDao) private readonly bankDao: IBankDao,
  ) {}

  public async execute(data: CreateBankInputDto): Promise<CreateBankOutputDto> {
    const existing = await this.bankDao.findByBankCodeAgencyAccount(
      data.bankCode,
      data.agency,
      data.account,
    );
    if (existing) {
      throw new BankAlreadyExistsError(
        data.bankCode,
        data.agency,
        data.account,
      );
    }

    const id = await this.bankDao.save(data);
    return { id };
  }
}
