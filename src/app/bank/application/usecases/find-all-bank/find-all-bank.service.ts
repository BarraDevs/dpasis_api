import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { BankDto } from '../../dtos/bank.dto';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { FindAllBankQueryDto } from './dtos/find-all-bank.dto';

@Injectable()
export class FindAllBank {
  constructor(
    @Inject(TOKENS.BankDao) private readonly bankDao: IBankDao,
  ) {}

  public async execute(queries: FindAllBankQueryDto): Promise<IPagination<BankDto>> {
    const [result, total] = await this.bankDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
